import { useLocation } from 'react-router-dom';
import Header from './Header';
import { headerConfig } from '../../../data/headerConfig';

export default function GlobalHeader() {
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  const currentConfig = headerConfig[location.pathname] || headerConfig['*'];

  return (
    <div className="pt-4 px-6 max-w-6xl mx-auto w-full relative z-10">
      <Header {...currentConfig} />
    </div>
  );
}
