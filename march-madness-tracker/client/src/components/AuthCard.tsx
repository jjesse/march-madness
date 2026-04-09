import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AlertMessage from './AlertMessage';
import PageHeader from './PageHeader';

interface AuthCardProps {
  title: string;
  description: string;
  error?: string;
  footerText: string;
  footerLinkLabel: string;
  footerLinkTo: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: ReactNode;
}

export default function AuthCard({
  title,
  description,
  error,
  footerText,
  footerLinkLabel,
  footerLinkTo,
  onSubmit,
  children,
}: AuthCardProps) {
  return (
    <div className="card form-card auth-card">
      <PageHeader title={title} description={description} />

      <form className="form-grid" onSubmit={onSubmit}>
        <AlertMessage type="error" message={error} />
        {children}
      </form>

      <p>
        {footerText} <Link to={footerLinkTo}>{footerLinkLabel}</Link>.
      </p>
    </div>
  );
}
