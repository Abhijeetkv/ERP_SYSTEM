import React from 'react';

const PageHeader = ({ title, description, children }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left — Title & description */}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>

        {/* Right — Action buttons */}
        {children && (
          <div className="flex shrink-0 items-center gap-3">{children}</div>
        )}
      </div>

      {/* Bottom divider */}
      <div className="mt-4 border-b border-slate-200" />
    </div>
  );
};

export default PageHeader;
