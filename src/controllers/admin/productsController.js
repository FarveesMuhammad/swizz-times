

import { Category } from "../../models/categorySchema.js" 
import { Product } from "../../models/productSchema.js" 
import { Brand } from "../../models/brandSchema.js";
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const getAllProducts = async (req,res) =>{
    try {
        let { page = 1, limit = 5, search = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const category = await Category.find({isDeleted:false})
        // console.log(category)
        const productData = await Product.find().sort({createdAt : -1}) .skip((page - 1) * limit).limit(limit).populate({ path: 'brand', model: 'Brand', select: 'brandName' }) 
        .populate('category'); 
        // console.log("this is category fromn populate",productData)
        const totalProducts = await Product.countDocuments()
        const totalPages = Math.ceil(totalProducts / limit);

        return res.render('admin/products',{
            productData,
            category : category._id,
            totalPages,
            currentPage: page,
            limit
        })


        
        
    } catch (error) {
        console.log('Error from get all products',error.message)
        res.status(500).json({success : false , message : "Internal server error"})
    }
}

const addProductsPage = async (req,res) =>{
    try {
        
        const category = await Category.find({isDeleted : false})
        const brand = await Brand.find({isBlocked : false})


        res.render('admin/addProducts',{category,brand})

    } catch (error) {
        console.error('Error from get all products',error.message)
        res.status(500).json({success : false , message : "Internal server error"})
    }
}



const saveProducts = async (req, res) => {
    try {

        const {
            productName,
            description,
            category,
            brand,
            regularPrice,
            salePrice,
            quantity,
            productOffer,
            status,
            images,
            caseMaterial,
            bandMaterial,
            claspType,
            country,
            waterResistance
        } = req.body;

        console.log(req.body)
        
        const category1 = await Category.findById(category)
        

  
        if (!productName || !description|| !regularPrice || !salePrice || !quantity || !status || !images || !caseMaterial || !bandMaterial || !claspType || !country ) {
            return res.status(400).json({ success: false, message: "All required fields must be filled." });
        }

        if (images.length !== 4) {
            return res.status(400).json({ success: false, message: "Exactly 4 product images are required." });
        }

        
        const parsedRegularPrice = parseFloat(regularPrice);
        const parsedSalePrice = parseFloat(salePrice);
        const parsedQuantity = parseInt(quantity, 10);
        const parsedOffer = parseInt(productOffer, 10) || 0; 

        
        if (parsedSalePrice > parsedRegularPrice) {
            return res.status(400).json({ success: false, message: "Sale price cannot be greater than the regular price." });
        }

        
        const newProduct = new Product({
            productName,
            description,
            category : category1._id,
            brand,
            regularPrice: parsedRegularPrice,
            salePrice: parsedSalePrice,
            quantity: parsedQuantity,
            productOffer: parsedOffer,
            status,
            productImage:images,
            case_material : caseMaterial,
            band_material : bandMaterial,
            clasp_type : claspType,
            country ,
            water_resistance : waterResistance
        });

    
        await newProduct.save();

        

        return res.status(201).json({ success: true, message: "Product added successfully!", product: newProduct });

    } catch (error) {
        console.error(' Error saving product:', error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product does not exist" });
        }

        // Permanently delete the product
        await Product.findByIdAndDelete(productId);

        res.status(200).json({ success: true, message: "Product deleted successfully" });

    } catch (error) {
        console.error("Error deleting product:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            productName,
            description,
            category,
            brand,
            regularPrice,
            salePrice,
            quantity,
            productOffer,
            status,
            productImage,
            case_material,
            band_material,
            clasp_type,
            country,
            water_resistance
        } = req.body;

       
        if (!productName || !description || !category || !brand || !regularPrice || !salePrice ||
             !status || !case_material || !band_material || !clasp_type || !country ||
            water_resistance === undefined || !productImage || productImage.length !== 4) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required, including exactly 4 images.'
            });
        }

       
        const parsedRegularPrice = parseFloat(regularPrice);
        const parsedSalePrice = parseFloat(salePrice);
        const parsedQuantity = parseInt(quantity) || 0;
        const parsedProductOffer = parseInt(productOffer) || 0;

        if (isNaN(parsedRegularPrice) || parsedRegularPrice < 0 ||
            isNaN(parsedSalePrice) || parsedSalePrice < 0 ||
            isNaN(parsedQuantity) || parsedQuantity < 0 ||
            parsedProductOffer < 0 || parsedProductOffer > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid numeric values.'
            });
        }

        if (parsedSalePrice > parsedRegularPrice) {
            return res.status(400).json({
                success: false,
                message: 'Sale price cannot be greater than regular price.'
            });
        }

        const isValidUrl = (url) => url && url.startsWith('https://res.cloudinary.com/');
        if (!productImage.every(isValidUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image URLs.'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                productName,
                description,
                category,
                brand,
                regularPrice: parsedRegularPrice,
                salePrice: parsedSalePrice,
                quantity: parsedQuantity,
                productOffer: parsedProductOffer,
                status,
                productImage,
                case_material,
                band_material,
                clasp_type,
                country,
                water_resistance: water_resistance === true || water_resistance === 'true'
            },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully.'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product.'
        });
    }

};

const toggleProductBlock = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product does not exist" });
        }

       
        product.isBlocked = !product.isBlocked;
        await product.save();

        res.status(200).json({ success: true, message: `Product ${product.isBlocked ? "blocked" : "unblocked"} successfully` });

    } catch (error) {
        console.error("Error toggling product block:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const loadEditProductPage = async(req,res) =>{
    try {

        const productId = req.params.id
        
        const currentProduct = await Product.findById(productId)
        // console.log(currentProduct,'===========================')

        const categories = await Category.find({isDeleted : false})
        // console.log(categories)
        const brands = await Brand.find({isBlocked : false})



        res.render('admin/editProduct',{
            categories,
            brands,
            currentProduct
            })
        
    } catch (error) {
        console.error("Error loading edit product page:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}





export default  {
  getAllProducts,
  addProductsPage,
  saveProducts,
  deleteProduct,
  updateProduct,
  toggleProductBlock,
  loadEditProductPage
}