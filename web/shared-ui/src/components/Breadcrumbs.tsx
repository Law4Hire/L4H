import React from 'react';

export const Breadcrumbs: React.FC = () => {
  // Use window.location to avoid dependency on Router context
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const pathnames = pathname.split('/').filter((x) => x);
  
  if (pathnames.length === 0) return null;

  return (
    <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex">
        <li className="flex items-center">
          <a href="/" className="hover:text-gray-700">Home</a>
          <span className="mx-2">/</span>
        </li>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = name.charAt(0).toUpperCase() + name.slice(1);
          
          return (
            <li key={name} className="flex items-center">
              {isLast ? (
                <span className="text-gray-700 font-semibold" aria-current="page">{displayName}</span>
              ) : (
                <>
                  <a href={routeTo} className="hover:text-gray-700">{displayName}</a>
                  <span className="mx-2">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
