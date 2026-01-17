import Index from '@/pages/Index';
import TenantLanding from '@/pages/TenantLanding';

const TenantRouter = () => {
  const hostname = window.location.hostname;
  const mainDomain = import.meta.env.VITE_MAIN_DOMAIN;
  const isMainDomain = hostname === mainDomain || hostname === 'localhost';

  // Main domain shows the original marketing site
  if (isMainDomain) {
    return <Index />;
  }

  // Tenant domains show Builder.io landing page
  return <TenantLanding />;
};

export default TenantRouter;
