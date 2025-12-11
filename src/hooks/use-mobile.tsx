import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const IOS_MOBILE_BREAKPOINT = 600;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsIOSMobile() {
  const [isIOSMobile, setIsIOSMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${IOS_MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsIOSMobile(window.innerWidth < IOS_MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsIOSMobile(window.innerWidth < IOS_MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isIOSMobile;
}
