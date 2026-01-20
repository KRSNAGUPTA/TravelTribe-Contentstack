import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthContext } from "../context/AuthContext";
import { House, LogIn, LogOut, LayoutDashboard, Search } from "lucide-react";
import { Dock, DockIcon } from "./magicui/dock";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import { Separator } from "@/components/ui/separator"


const Header = () => {
  const [userInfo, setUserInfo] = useState(null)
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  useEffect(() => {
    console.log("User logined")
    setUserInfo(user);
  }, [user]);
  const toolTipContentCss = "text-black rounded-full border px-4 py-2 font-bold bg-white"

  return (
    <div className="relative">
      <TooltipProvider>
        <Dock direction="middle">
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild >
                <div onClick={() => navigate("/")} className="cursor-pointer">
                  <House className="size-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className={toolTipContentCss}>
                <p>Home</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          <Separator orientation="vertical" />
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => navigate("/hostel")}
                  className="cursor-pointer"
                >
                  <Search className="size-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className={toolTipContentCss}>
                <p>Search</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>

          {userInfo ? (
            <>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer"
                    >
                      <Avatar className="size-7">
                        <AvatarImage
                          src={userInfo?.avatar || "/vite.svg"}
                          alt={userInfo?.name}
                        />
                        <AvatarFallback className="bg-gray-600 text-white text-sm md:text-lg font-semibold">
                          {userInfo?.name ? userInfo?.name[0].toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className={toolTipContentCss}>
                    <p>{userInfo?.name ? `Profile | ${userInfo.name}` : "user"}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <Separator orientation="vertical" />
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div onClick={logout} className="cursor-pointer">
                      <LogOut className="size-5 text-red-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className={toolTipContentCss}>
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            </>
          ) : (
            <>
              <Separator orientation="vertical" />
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => navigate("/login")}
                      className="cursor-pointer"
                    >
                      <LogIn className="size-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className={toolTipContentCss}>
                    <p>Login</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            </>
          )}
        </Dock>
      </TooltipProvider>
    </div>
  );
};

export default Header;
