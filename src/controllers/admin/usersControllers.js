import  {User}  from "../../models/userSchema.js"

const getUserPage = async (req, res) => {
    try {
        let { page = 1, limit = 5, search = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        let query = {};

        if (search.trim() !== "") {
            query = {
                $or: [
                    { username: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            };
        }

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(); 

        res.render("admin/users", {
            users,
            totalPages,
            currentPage: page,
            search,
            limit
        });

    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


const blockUnblockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ success: true, isBlocked: user.isBlocked });
    } catch (error) {
        console.log("Error toggling user block status:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


export default {
    getUserPage,
    blockUnblockUser
}