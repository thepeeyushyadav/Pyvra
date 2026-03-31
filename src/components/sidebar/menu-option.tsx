"use client";

import useMounted from "@/hooks/useMounted";
import {
  Agency,
  AgencySidebarOption,
  SubAccount,
  SubAccountSidebarOption,
} from "@prisma/client";
import clsx from "clsx";
import { ChevronsUpDown, Menu, PlusCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Compass from "../icons/compass";
import { AspectRatio } from "../ui/aspect-ratio";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { useModal } from "@/providers/modal-provider";
import CustomModal from "../global/custom-modal";
import SubAccountDetails from "../forms/subaccount-details";
import { Separator } from "../ui/separator";
import { icons } from "@/lib/constants";

type Props = {
  defaultOpen?: boolean;
  subAccounts: SubAccount[];
  sidebarOpt: AgencySidebarOption[] | SubAccountSidebarOption[];
  sidebarLogo: string;
  details: any;
  user: any;
  id: string;
};

const FALLBACK_LOGO = "/assets/pyvra-logo.svg";

const FallbackImage = ({ src, alt }: { src: string | null | undefined; alt: string }) => {
  const resolved = src && src.trim() !== '' ? src : FALLBACK_LOGO;
  const [imgSrc, setImgSrc] = useState(resolved);
  useEffect(() => {
    setImgSrc(src && src.trim() !== '' ? src : FALLBACK_LOGO);
  }, [src]);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      unoptimized
      className="rounded-md object-contain"
      onError={() => setImgSrc(FALLBACK_LOGO)}
    />
  );
};

const MenuOptions = ({
  defaultOpen,
  subAccounts,
  sidebarOpt,
  sidebarLogo,
  details,
  user,
  id,
}: Props) => {
  const { setOpen } = useModal();
  const mounted = useMounted();
  const pathname = usePathname();

  const openState = useMemo(
    () => (defaultOpen ? { open: true } : {}),
    [defaultOpen],
  );

  if (!mounted) return;

  return (
    <Sheet modal={false} {...openState}>
      <SheetTrigger
        asChild
        className="absolute left-4 top-4 z-[100] md:!hidden flex"
      >
        <Button variant="outline" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent
        showX={!defaultOpen}
        side={"left"}
        className={clsx(
          `bg-background/80 backdrop-blur-xl fixed top-0 border-r p-6`,
          {
            "hidden md:inline-block z-0 w-[300px]": defaultOpen,
            "inline-block md:hidden z-[100] w-full": !defaultOpen,
          },
        )}
      >
        <div>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <AspectRatio ratio={16 / 5}>
            <Image
              src="/assets/pyvra-logo.svg"
              alt="Sidebar Logo"
              fill
              className="rounded-md object-contain"
            />
          </AspectRatio>
          <Popover>
            <PopoverTrigger asChild className="w-full">
              <Button
                variant={"ghost"}
                className="w-full p-4 my-4 flex items-center justify-between py-8"
              >
                <div className="flex items-center text-left gap-2 min-w-0 flex-1 overflow-hidden">
                  <div className="shrink-0"><Compass /></div>
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className="font-medium truncate">{details.name}</span>
                    <span className="text-muted-foreground text-xs truncate">
                      {details.address}
                    </span>
                  </div>
                </div>
                <div>
                  <ChevronsUpDown size={10} className="text-muted-foreground" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 h-auto mt-4 z-[200]">
              {
                <Command className="rounded-lg">
                  <CommandInput placeholder="Accounts..." />
                  <CommandList className="pb-16">
                    <CommandEmpty>No Results founds</CommandEmpty>
                    {(user?.role === "AGENCY_OWNER" ||
                      user?.role === "AGENCY_ADMIN") &&
                      user?.Agency && (
                        <CommandGroup heading="Agency">
                          <CommandItem className="!bg-transparent my-2 text-primary border border-border p-2 rounded-md hover:!bg-muted cursor-pointer transition-all">
                            {defaultOpen ? (
                              <Link
                                href={`/agency/${user?.Agency?.id}`}
                                className="flex gap-4 w-full h-full"
                              >
                                <div className="relative w-16 h-16">
                                  <FallbackImage
                                    src={sidebarLogo}
                                    alt="Agency Logo"
                                  />
                                </div>
                                <div className="flex flex-col flex-1">
                                  {user?.Agency?.name}
                                  <span className="text-muted-foreground">
                                    {user?.Agency?.address}
                                  </span>
                                </div>
                              </Link>
                            ) : (
                              <SheetClose asChild>
                                <Link
                                  href={`/agency/${user?.Agency?.id}`}
                                  className="flex gap-4 w-full h-full"
                                >
                                  <div className="relative w-16 h-16">
                                    <FallbackImage
                                      src={sidebarLogo}
                                      alt="Agency Logo"
                                    />
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    {user?.Agency?.name}
                                    <span className="text-muted-foreground">
                                      {user?.Agency?.address}
                                    </span>
                                  </div>
                                </Link>
                              </SheetClose>
                            )}
                          </CommandItem>
                        </CommandGroup>
                      )}
                    <CommandGroup heading="Accounts">
                      {!!subAccounts
                        ? subAccounts.map((subaccount) => (
                            <CommandItem key={subaccount.id}>
                              {defaultOpen ? (
                                <Link
                                  href={`/subaccount/${subaccount.id}`}
                                  className="flex gap-4 w-full h-full"
                                >
                                  <div className="relative w-16">
                                    <FallbackImage
                                      src={subaccount.subAccountLogo}
                                      alt="subaccount Logo"
                                    />
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    {subaccount.name}
                                    <span className="text-muted-foreground">
                                      {subaccount.address}
                                    </span>
                                  </div>
                                </Link>
                              ) : (
                                <SheetClose asChild>
                                  <Link
                                    href={`/subaccount/${subaccount.id}`}
                                    className="flex gap-4 w-full h-full"
                                  >
                                    <div className="relative w-16">
                                      <FallbackImage
                                        src={subaccount.subAccountLogo}
                                        alt="subaccount Logo"
                                      />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                      {subaccount.name}
                                      <span className="text-muted-foreground">
                                        {subaccount.address}
                                      </span>
                                    </div>
                                  </Link>
                                </SheetClose>
                              )}
                            </CommandItem>
                          ))
                        : "No Accounts"}
                    </CommandGroup>
                  </CommandList>
                  {(user?.role === "AGENCY_OWNER" ||
                    user?.role === "AGENCY_ADMIN") && (
                    <Button
                      className="w-full flex gap-2"
                      onClick={() => {
                        setOpen(
                          <CustomModal
                            title="Create A Subaccount"
                            subheading="You can switch between your agency account and the subaccount from the sidebar"
                          >
                            <SubAccountDetails
                              agencyDetails={user?.Agency as Agency}
                              userId={user?.id as string}
                              userName={user?.name}
                            />
                          </CustomModal>,
                        );
                      }}
                    >
                      <PlusCircleIcon size={15} />
                      Create Sub Account
                    </Button>
                  )}
                </Command>
              }
            </PopoverContent>
          </Popover>
          <p className="text-muted-foreground text-xs mb-2">MENU LINKS</p>
          <Separator className="mb-4" />
          <nav className="relative">
            <Command className="rounded-lg overflow-visible bg-transparent">
              <CommandInput placeholder="Search..." />
              <CommandList className="py-4 overflow-visible">
                <CommandEmpty>No Results found</CommandEmpty>
                <CommandGroup className="overflow-visible">
                  {(() => {
                    const EXACT_ORDER = [
                      "Dashboard",
                      "Media",
                      "Team",
                      "Billing",
                      "Sub Accounts",
                      "Launchpad",
                      "Settings"
                    ];

                    const sortedSidebarOpt = [...sidebarOpt].sort((a, b) => {
                      const indexA = EXACT_ORDER.indexOf(a.name);
                      const indexB = EXACT_ORDER.indexOf(b.name);
                      const aVal = indexA === -1 ? 999 : indexA;
                      const bVal = indexB === -1 ? 999 : indexB;
                      return aVal - bVal;
                    });

                    return sortedSidebarOpt.map((sidebarOption) => {
                      let val;
                      const result = icons.find(
                        (icon) => icon.value === sidebarOption.icon,
                      );

                      if (result) {
                        val = <result.path />;
                      }

                      const isRootLink = sidebarOption.link.split('/').length <= 3;
                      const isActive = isRootLink 
                        ? pathname === sidebarOption.link
                        : pathname.startsWith(sidebarOption.link);

                      return (
                        <CommandItem 
                          key={sidebarOption.id} 
                          value={sidebarOption.name}
                          className={clsx(
                            "w-full p-0 mb-2 rounded-md overflow-hidden",
                            "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                          )}
                        >
                          <Link
                            href={sidebarOption.link}
                            className={clsx(
                              "group flex gap-3 items-center w-full px-3 py-2.5 rounded-lg transition-all duration-300 ease-out cursor-pointer",
                              isActive 
                                ? "bg-primary text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.25)] shadow-primary/30" 
                                : "bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1 font-medium"
                            )}
                          >
                            <div className={clsx(
                              "transition-all duration-300 ease-out", 
                              isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-[-5deg]"
                            )}>
                              {val}
                            </div>
                            <span>{sidebarOption.name}</span>
                          </Link>
                        </CommandItem>
                      );
                    });
                  })()}
                </CommandGroup>
              </CommandList>
            </Command>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MenuOptions;
