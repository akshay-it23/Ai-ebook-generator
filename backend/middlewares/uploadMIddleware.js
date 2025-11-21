const multer=require("multer";
    const path=require("path");
    const fs=requre()
)

const uploadDir="uploads";
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});


}

const storage=multer.diskStorage({
    destination:function( req,file,cb) {
        cb(null,uploadDir);
    },
    filename: function(req,file,cb){
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});
function checkFileType(file,cb){
    const filetypes=/jpeg |jpg | png |gif/;
    const extname=filetypes.test(path.extname(file.orginalname).toLowerCase());
    const mimetype=filetypes.test(file.mimetype);


    if(mimetype && extname){
        return cb(null,true);
    }
    else{
        cb("Error :Image only");
    }
}
//check file type
