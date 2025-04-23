import { Product } from "../../models/productSchema.js";
import { User } from "../../models/userSchema.js";
import { Cart } from "../../models/cartSchema.js";
import { Category } from "../../models/categorySchema.js";
import { Wishlist } from "../../models/wishlistSchema.js";



const loadCart = async(req,res) =>{
    try {
        const userId = req.user._id
        if (!userId) {
            return res.redirect('/login');
        }
        const user = req.user
        console.log(user)

        const cart = await Cart.findOne({ userId }).populate("items.product")
        if (!cart || cart.items.length === 0) {
            return res.render("user/cart", { cart: null ,user});
        }

        cart.items = cart.items.filter(item => item.product && !item.product.isBlocked);

        if (cart.items.length === 0) {
            return res.render("user/cart", { cart: null, user });
        }

        res.render('user/cart',{cart,user})
        
    } catch (error) {
        console.error("Error from load cart:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;
        
        const product = await Product.findById(productId).populate("category");

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (product.isBlocked || product.status !== "Available") {
            return res.status(403).json({ success: false, message: "This product is no longer available." });
        }

   
        if (product.category.isDeleted) {
            return res.status(403).json({ success: false, message: "This product category is restricted." });
        }

      
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            
            cart = new Cart({
                userId,
                items: [{ product: productId, quantity, price: product.salePrice }],
                bill: product.salePrice * quantity
            });
        } else {
           
            let itemIndex = cart.items.findIndex(item => item.product.toString() === productId)

            if (itemIndex > -1) {
          
                cart.items[itemIndex].quantity += quantity;
            } else {
               
                cart.items.push({ product: productId, quantity, price: product.salePrice })
            }

       
            cart.bill = cart.items.reduce((total, item) => total + item.quantity * item.price, 0)
        }

        await cart.save();
        await Wishlist.findOneAndUpdate(
            { userId },
            { $pull: { items: { product: productId } } } 
        );

        return res.status(200).json({ success: true, message: "Product added to cart" });

    } catch (error) {
        console.error("Error from addToCart:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateCart = async (req, res) => {
    try {
        const { productId, change } = req.body;
    const userId = req.user._id; 

        const cart = await Cart.findOne({ userId }).populate("items.product")
        if (!cart) {

        return res.status(404).json({ success: false, message: "Cart not found" })
        }

    const item = cart.items.find(item => item.product._id.toString() === productId);
        if (!item) {

        return res.status(404).json({ success: false, message: "Product not found in cart" })
        }

            const product = item.product;

      
        if (change === 1 && item.quantity >= product.quantity) {

            return res.status(400).json({ success: false, message: "Not enough stock available" })

        }

        
        if (change === -1 && item.quantity <= 1) {


            return res.status(400).json({ success: false, message: "Minimum quantity is 1" });
        }

      
        item.quantity += change
        item.totalPrice = item.quantity * item.price

        cart.bill = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
        await cart.save();

        return res.json({ success: true, cart });

    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        cart.bill = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
        await cart.save();

        return res.json({ success: true, message: "Item removed from cart" });

    } catch (error) {
        console.error("Error removing item:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



export default {loadCart,
                addToCart,
                updateCart,
                removeFromCart
            }