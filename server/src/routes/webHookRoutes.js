import { Router } from "express";
import { hostelDataHook } from "../webhook/cmsHook.js";

const router = Router();

const protectHook = async(req,res,next)=>{
    try {
        if(req.headers['webhook-secret'] !== process.env.WEBHOOK_SECRET){
            return res.status(401).json({
                message:"Not authorized, Please add 'webhook-secret' in header with correct value"
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            error
        })
    }
}

router.get("/room-data-hook",protectHook, (req,res)=>{
    return res.status(200).json({
        message:"Room Data hook is working."
    })
})
router.post("/room-data-hook",protectHook, hostelDataHook);
export default router;