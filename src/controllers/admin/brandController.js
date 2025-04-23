import { Brand } from "../../models/brandSchema.js"

export const getBrandPage = async(req,res) =>{
    try {

       const page = parseInt(req.query.page) || 1
       const limit = 3;
       const skip = (page-1)*limit
       const brandData = await Brand.find({isDeleted : false}).sort({createdAt:-1}).skip(skip).limit(limit)
       const totalBrands = await Brand.countDocuments()
       const totalPages = Math.ceil(totalBrands/limit)
    //    const reverseBrand = brandData.reverse()
      return res.render("admin/brands",{
        data : brandData,
        currentPage : page,
        totalPages : totalPages,
        totalBrands : totalBrands,
       })
      
  
    } catch (error) {
        console.error('Error from get brand page')
        res.status(500).json({success : false, message : "Internal server error"})
    }
}

const getAddBrandPage = (req,res) =>{
    try {
        
        return res.render('admin/addBrand')

    } catch (error) {
        console.error('Error from get add brand page',error.message)
        res.status(500).json({success : false, message : "Internal server error"})
    }
}

const saveBrand = async(req,res) =>{
    try {

         let {brandName,imageUrl} = req.body

            brandName = brandName.trim().toUpperCase()
                
                if(!brandName || !imageUrl){
        
                   return res.status(401).json({success : false, message : "Please enter everyfield"})
                   
                }
                const existingBrand = await Brand.findOne({brandName : brandName})
                // console.log(existingBrand)
                if(existingBrand){
                    
                    return res.status(401).json({success : false, message : "Brand already exist"})
                    
                }
                const existingBrandImg = await Brand.findOne({imageUrl})
                if(existingBrandImg){
                    
                    return res.status(401).json({success : false, message : "ImageUrl already exist"})
                    
                }
                const newBrand = new Brand({
                    brandName : brandName,
                    brandImage : imageUrl
                })
                await newBrand.save()
        
                res.status(200).json({success : true, message : "Brand added successfully"})
        
    } catch (error) {
        console.error('Error from post add brand page',error.message)
        res.status(500).json({success : false, message : "Internal server error"})
    }
}

const blockUnblockBrand = async (req, res) => {
    try {
        const { brandId } = req.body;
        const brand = await Brand.findById(brandId);

        if (!brand) {
            return res.status(404).json({ error: "User not found" });
        }

        brand.isBlocked = !brand.isBlocked;
        await brand.save();

        res.json({ success: true, isBlocked: brand.isBlocked });
    } catch (error) {
        console.log("Error toggling brand block status:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
const deleteBrand = async (req, res) => {
    try {
        const brandId = req.params.id;

        const brand = await Brand.findById(brandId);
        if (!brand) {
            return res.status(404).json({ success: false, message: "Brand doesn't exist" });
        }

        await Brand.findByIdAndUpdate(brandId, { isDeleted: true });
        res.status(200).json({ success: true, message: "Brand deleted successfully" });
    } catch (error) {
        console.error("Error from delete brand", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateBrand = async (req, res) => {
    try {
        const brandId = req.params.id;
        const { name, image } = req.body;

        const brand = await Brand.findById(brandId);
        if (!brand) {
            return res.status(404).json({ success: false, message: "Brand not found" });
        }

        const existingBrand = await Brand.findOne({ name, _id: { $ne: brandId } });
        if (existingBrand) {
            return res.status(400).json({ success: false, message: "Brand name already exists" });
        }

        brand.brandName = name;
        brand.brandImage = image;
        await brand.save();

        res.status(200).json({ success: true, message: "Brand updated successfully" });
    } catch (error) {
        console.error("Error from update brand", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export default {
    getBrandPage,
    getAddBrandPage,
    saveBrand,
    blockUnblockBrand,
    deleteBrand,
    updateBrand
}