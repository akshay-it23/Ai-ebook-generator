const jwt=require("jsonwebtoken");
const User =require("../models/User");









const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SCERET,{
        expiresIN:"7d",

    });
};







//register----------
exports.registerUser=async (req,res)=>{
    const{name,email,password}=req.body;
    try{
if(!name || !email ||!password){
    return res.status(400).json({message:"please fill all field"});
}
const userExists=await User.findOne({email});
if(userExists){
    res.status(400).json({message:"User already exist"});
}
    }
    catch(error){
        res.status(500).json({message:"server error"});

    }
}





exports.loginUser=async (req,res)=>{
    const{ email,password}=req.body;
     try{
const user=await User.findOne({email}).select("+password");



if(user && ( await UsermatchPassword({password}))){
    res.json({
        message:"Login successfull",
        _id:user._id,
        name:user.name,
        email:user.email,
        token:generateToken(user._id),
    })
}
else{
    res.status(401).json({message:"invlaid credentails"});
}

    }
    catch(error){
        res.status(500).json({message:"server error"})

    }
};
exports.getProfile=async (req,res)=>{
 try{
    const user=await User.findById(req.user.id);
    res.json({
        _id:user._id,
        name:user.name,
        email:user.email,
        avatar:user.avatar,
        isPro:user.isPro,
    });

    }
    catch(error){
        res.status(500).json({message:"server error"})

    }
};




exports.updateUserProfile=async(req,res)=>{
 try{
const user=await User.findById(req.user.id);
if(user){
    user.name=req.body.name || user.name;
    const updatedUser=await user.save();

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
    });
}
else{
    res.status(404).json({message:"user not found"});
}
    }
    catch(error){
        res.status(500).json({message:"server error"})

    }
};