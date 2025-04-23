import { Category } from "../../models/categorySchema.js" 


const categoryGet = async (req,res) =>{
    try {
        
        let { page = 1, search = "" } = req.query;
        page = parseInt(page) || 1;
        let limit = 10; 

        const searchFilter = search
            ? { name: { $regex: search, $options: "i" }, isDeleted: false }
            : { isDeleted: false };

        const totalCategories = await Category.countDocuments(searchFilter);

        const totalPages = Math.ceil(totalCategories / limit);

        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;

        const categories = await Category.find(searchFilter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
            res.render("admin/category", { 
                categories, 
                currentPage: page, 
                totalPages,
                searchQuery: search 
            });
            

    } catch (error) {
        console.error("Error from category get",error.message)
        res.status(500).json({error : "Internal server error"})
    }
}

const getAddCategoryPage = (req,res) =>{
    try {
        
        res.render('admin/addCategory')

    } catch (error) {
        console.error("Error from add category page get",error.message)
        res.status(500).json({error : "Internal server error"})
    }
}


const addCategory = async(req,res) =>{
    try {
        let {categoryName,categoryDescription,categoryOffer} = req.body

        categoryName = categoryName.trim().toUpperCase()
        
        if(!categoryName || !categoryDescription ){

           return res.status(401).json({success : false, message : "Please enter everyfield"})
           
        }
        const existingCategory = await Category.findOne({name : categoryName})
        if(existingCategory){
            
            return res.status(401).json({success : false, message : "Category already exist"})
            
        }
        
        
        const newCategory = new Category({
            name : categoryName,
            description : categoryDescription,
            offer : categoryOffer
       
        })
        await newCategory.save()

        res.status(200).json({success : true, message : "Category added successfully"})

    } catch (error) {
        console.error("Error from add category post",error.message)
        res.status(500).json({error : "Internal server error"})
    }
}

const toggleCategoryBlock = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category does not exist" });
        }

       
        category.isDeleted = !category.isDeleted;
        await category.save();

        res.status(200).json({ success: true, message: `Category ${category.isDeleted ? "blocked" : "unblocked"} successfully` });

    } catch (error) {
        console.error("Error toggling category block:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const updateCategory = async ( req,res ) =>{
    try {
        
        const categoryId = req.params.id
        const { name, description, offer } = req.body

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const existingCategory = await Category.findOne({ name, _id: { $ne: categoryId } });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category name already exists" });
        }
        if (offer < 0 || offer > 100 || isNaN(offer)) {
            return res.status(400).json({ success: false, message: "Offer must be between 0 and 100" });
        }

        category.name = name,
        category.description = description,
        category.offer = offer;
        await category.save()

        res.status(200).json({success : true, message : "Category updated successfully"})

    } catch (error) {
        console.error("Error from update category ",error.message)
        res.status(500).json({error : "Internal server error"})
    }
}

export default {
    categoryGet,
    getAddCategoryPage,
    addCategory,
    toggleCategoryBlock,
    updateCategory
}