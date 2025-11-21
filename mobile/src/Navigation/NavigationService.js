import { createRef } from 'react';

export const navigationRef = createRef();

export const navigate = (name, params) => {
  navigationRef.current?.navigate(name, params);
};

export const resetNavigation = (routes) => {
  if (!routes || routes.length === 0) {
    return;
  }

  navigationRef.current?.reset({
    index: 0,
    routes,
  });
};

export const resetToAuth = () => resetNavigation([{ name: "Auth" }]);

export const resetToMain = () => resetNavigation([{ name: "Main" }]);