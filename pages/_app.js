import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Auth from './auth';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [user, loading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  

  // useEffect(() => {
  //   if (user) {
  //     //console.log('User is signed in:', user);
  //   } else if (!loading) {
  //     //console.log('No user signed in');
  //   }
  // }, [user, loading]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return <Component {...pageProps} />;
}

export default MyApp;