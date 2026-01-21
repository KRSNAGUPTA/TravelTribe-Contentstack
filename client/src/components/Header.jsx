import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthContext } from "../context/AuthContext";
import { House, LogIn, LogOut, Search } from "lucide-react";
import { Dock, DockIcon } from "./magicui/dock";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import { Separator } from "@/components/ui/separator"
import Stack from "@/sdk/contentstackSDK";
import cmsClient from "@/contentstackClient";


const Header = () => {
  const [userInfo, setUserInfo] = useState(null)
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [icons, setIcons] = useState();
  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const entry = (
          await cmsClient.get(
            "/content_types/header/entries/bltf9dba16208e02dd7"
          )
        ).data.entry;

        setIcons(entry);
        if (entry?.page_title) document.title = entry.page_title;
      } catch (error) {
        console.error("CDA: Error fetching CMS data for Profiel Page:", error?.message);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack
          .ContentType("header")
          .Entry("bltf9dba16208e02dd7")
          .toJSON()
          .fetch();
        setIcons(entry);
        // console.log(entry)
        if (entry?.page_title) document.title = entry.page_title;
      } catch (error) {
        console.error("SDK: Error fetching Profile Page data:", error?.message);
      }
    };

    if (import.meta.env.VITE_SDK === "true") {
      // console.log("SDK active")
      fetchSDKData()
    } else {
      fetchCDAData();
      // console.log("CDA active")
    }
  }, []);

  useEffect(() => {
    // console.log("User logined")
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
                  {icons?.home ?
                  <img src={icons?.home.url} className="size-5 select-none" alt="Home" draggable={false} />
                  : <House/>
}
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
                  className=""
                >
                  {icons?.search ?
                    <img src={icons?.search.url} className="size-5 select-none" alt="Search" draggable={false} />
                    : <Search />
                  }
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
                    <div onClick={logout}>
                      {icons?.logout ?
                        <img src={icons?.logout.url} className="size-5 select-none" alt="Logout" draggable={false} />
                        : <LogOut />
                      }
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
                    >
                      {icons?.login ?
                        <img src={icons?.login.url} className="size-5 select-none" alt="Login" draggable={false} />
                        : <LogIn />
                      }
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
