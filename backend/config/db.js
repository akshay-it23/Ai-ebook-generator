const mongoose=require('mongoose');
//its hep in connecting makeing schema,connection,model,database

const connectDB= async ()=>{
    try{
        //{}-to enable default setting like new parse , new engine use hoga ,databse name
        await mongoose.connect(process.env.MONGO_URI,{});
        console.log("Mongodb connected");
    }
    catch(err){
        console.error("error connecting to mongodb",err);
        process.exit(1);//1 k means failure and 0 k mltb sucess
    }
}
module.exports=connectDB; 