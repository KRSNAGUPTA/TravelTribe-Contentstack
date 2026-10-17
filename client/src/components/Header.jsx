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
import { Separator } from "@/components/ui/separator";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntries } from "@/contentstack/utils";
import { addEditableTags } from "@contentstack/utils";

const TOOLTIP_CLASS =
  "text-black rounded-full border px-4 py-2 font-bold bg-white";

const Header = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [icons, setIcons] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = (await fetchEntries("header"))[0];
        if (!entry) return;

        addEditableTags(entry, "header", true, "en-us");
        setIcons(entry);
        if (entry.page_title) document.title = entry.page_title;
      } catch (error) {
        console.error("Error fetching header:", error?.message);
      }
    };

    fetchData();
    onEntryChange(fetchData);
  }, []);

  useEffect(() => {
    setUserInfo(user);
  }, [user]);

  return (
    <div className="relative">
      <TooltipProvider>
        <Dock direction="middle" className="rounded-full">
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => navigate("/")}
                  className="cursor-pointer"
                  {...icons?.$?.home}
                >
                  {icons?.home ? (
                    <img
                      src={icons.home.url}
                      className="size-5 select-none"
                      alt="Home"
                      draggable={false}
                    />
                  ) : (
                    <House />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CLASS}>
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
                  {...icons?.$?.search}
                >
                  {icons?.search ? (
                    <img
                      src={icons.search.url}
                      className="size-5 select-none"
                      alt="Search"
                      draggable={false}
                    />
                  ) : (
                    <Search />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CLASS}>
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
                          {userInfo?.name
                            ? userInfo.name[0].toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className={TOOLTIP_CLASS}>
                    <p>
                      {userInfo?.name
                        ? `Profile | ${userInfo.name}`
                        : "Profile"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>

              <Separator orientation="vertical" />

              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={logout}
                      className="cursor-pointer"
                      {...icons?.$?.logout}
                    >
                      {icons?.logout ? (
                        <img
                          src={icons.logout.url}
                          className="size-5 select-none"
                          alt="Logout"
                          draggable={false}
                        />
                      ) : (
                        <LogOut />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className={TOOLTIP_CLASS}>
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
                      {...icons?.$?.login}
                    >
                      {icons?.login ? (
                        <img
                          src={icons.login.url}
                          className="size-5 select-none"
                          alt="Login"
                          draggable={false}
                        />
                      ) : (
                        <LogIn />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className={TOOLTIP_CLASS}>
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