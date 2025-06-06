
import { Product } from "../../models/productSchema.js"
import { Category } from "../../models/categorySchema.js" 
import { Brand } from "../../models/brandSchema.js";
import { User } from "../../models/userSchema.js";
import { mongoose } from "mongoose";

const homeGet = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect('/login');
        }
        const bestSellingProducts = await Product.find({ isBlocked: false })
            .sort({ totalSold: -1 }) 
            .limit(10)
            .populate('category');

        const newArrivals = await Product.find({ isBlocked: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('category');

        res.render('user/home', {
            user,
            bestSellingProducts,
            newArrivals
        });
    } catch (error) {
        console.error('Error fetching products.......', error);
        res.render('user/home', {
            bestSellingProducts: [],
            newArrivals: [],
            error: 'Failed to load products'
        });
    }
};




const shopGet = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect('/login');
        }

        let { page = 1, limit = 6, sort = "newest", search = "", category = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        let query = { isBlocked: false };

        if (search.trim() !== "") {
            query.productName = { $regex: search, $options: "i" }; 
        }
        if (category && category !== "all") {
            query.category = category;
        }

        let sortQuery = {};
        if (sort === "newest") {
            sortQuery = { createdAt: -1 };
        } else if (sort === "priceLowHigh") {
            sortQuery = { salePrice: 1 };
        } else if (sort === "priceHighLow") {
            sortQuery = { salePrice: -1 };
        } else if (sort === "nameAZ") {
            sortQuery = { productName: 1 }
        } else if (sort === "nameZA") {
            sortQuery = { productName: -1 };
        }

        const categories = await Category.find({ isDeleted: false });
        const categoryIds = categories.map(cat => cat._id); 

        const brand = await Brand.find({ isDeleted: false });

        const products = await Product.find(query)
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({ path: 'brand', model: 'Brand', select: 'brandName' })
            .populate('category');

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('user/shop', {
            categories,
            products,
            brand,
            totalPages,
            currentPage: page,
            sort,
            search,
            selectedCategory: category,
            user
        });

    } catch (error) {
        console.error("Error in shopGet:", error);
        res.status(500).send("Internal Server Error");
    }
};


const productDetailPage = async (req, res) => {
    try {
        
        const user = req.user
        const productId = req.params.id;
        console.log(productId)
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.render('error');  
        }

        const product = await Product.findById(productId)
        .populate({ path: 'brand', model: 'Brand', select: 'brandName' }) 
        .populate('category'); 
        
        
        if (!product) {
            return res.redirect('/shop');  
        }
        
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: productId },  
            isBlocked: false,
            status: "Available"
        })
        .limit(4)
        .populate('brand');
        
     
        res.render('user/productDetails', {
            product,
            relatedProducts,
            user
        });
        
    } catch (error) {
        console.error("Error from product detail page get", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


const reviewAdd = async (req,res) =>{
    try {
        const { name, email, rating, review } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

      
        product.reviews.push({ name, email, rating, review });


        const totalRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
        product.ratings = totalRatings / product.reviews.length;

        await product.save();
        res.redirect(`/shop/product/${req.params.id}`);
    } catch (error) {
        console.error("Error submitting review:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export default {
    homeGet,
    shopGet,
    productDetailPage,
    reviewAdd
}