import { Wishlist } from "../../models/wishlistSchema.js"


const loadWishlist = async(req,res) =>{
    
    try {
        const userId = req.user._id
        if (!userId) {
            return res.redirect('/login');
        }
        const user = req.user
    const wishlist = await Wishlist.findOne({ userId: user })
    .populate({
        path: "items.product",
        populate: {
            path: "category", 
            model: "Category"
        }
    });
    // console.log(wishlist)

        
        res.render('user/wishlist',{wishlist,user})

    } catch (error) {
        console.error("Error from load wishlist:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const addToWishlist = async (req,res) =>{
    try {
        const user = req.user
        if (!user) {
            return res.redirect('/login');
        }
        const{ productId} = req.body
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }
        
        let wishlist = await Wishlist.findOne({userId: user })
        if (!wishlist) {
            wishlist = new Wishlist({ userId : user, items: [] });
        }
        const existingItem = wishlist.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            return res.status(400).json({ success: false, message: "Product already in wishlist" });
        }
        wishlist.items.push({product : productId});
        await wishlist.save()
        
        res.status(200).json({ success: true, message: "Product added to wishlist", wishlist })
   
        
    } catch (error) {
        console.error("Error from add to wishlist:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" })

    }
}
const removeFromWishlist = async (req,res) =>{
    try {
        const user = req.user
        if (!user) {
            return res.redirect('/login');
        }

        const userId = req.user._id;
        const { productId } = req.params;

        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        wishlist.items = wishlist.items.filter(item => item.product.toString() !== productId);
        await wishlist.save();

        return res.status(200).json({ success: true, message: "Product removed from wishlist", wishlist });
    } catch (error) {
        console.error("Error from removeFromWishlist:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}




export default {
    loadWishlist,
    addToWishlist,
    removeFromWishlist
}