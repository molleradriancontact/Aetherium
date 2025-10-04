
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebase, initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GoogleAuthProvider, linkWithCredential, AuthError, getAdditionalUserInfo, UserCredential, OAuthCredential } from 'firebase/auth';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';


function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,36.45,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
    );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [pendingCred, setPendingCred] = useState<OAuthCredential | null>(null);

  React.useEffect(() => {
    if(!isUserLoading && user) {
        router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (pendingCred) {
        // If there's a pending credential, it means we need to link accounts.
        // We sign in with email/password first, which returns a userCredential.
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            // Then, we link the pending Google credential.
            await linkWithCredential(userCredential.user, pendingCred);
            toast({
                title: "Accounts Linked",
                description: "Your Google account is now linked."
            });
            // The onAuthStateChanged listener in FirebaseProvider will handle the redirect.
        } catch (error: any) {
            const authError = error as AuthError;
            toast({ variant: 'destructive', title: 'Account Linking Failed', description: authError.message });
            setPendingCred(null); // Clear pending credential on failure
        } finally {
            setIsLoading(false);
        }

    } else {
        // Standard email sign-in. We don't await this so the UI doesn't block.
        // The onAuthStateChanged listener will handle success/failure navigation/toast.
        initiateEmailSignIn(auth, email, password);
        // A full implementation would listen for the result of this and then stop the loading spinner
        // For this prototype, we'll optimistically assume it works or global error handling catches it.
        // We will manually stop the loader after a short delay to give feedback.
        setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        // We must await the popup to know if we need to handle account linking.
        await auth.signInWithPopup(new GoogleAuthProvider());
        // If successful, onAuthStateChanged handles the redirect.
    } catch (error: any) {
      const authError = error as AuthError;
      if (authError.code === 'auth/account-exists-with-different-credential' && authError.customData.email) {
        const pendingCred = GoogleAuthProvider.credentialFromError(authError);
        if (pendingCred) {
          setEmail(authError.customData.email as string);
          setPendingCred(pendingCred);
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Sign in with your password to link your Google account.",
          });
        } else {
             toast({ variant: 'destructive', title: 'Google Sign-in failed.', description: 'Could not retrieve credentials for account linking.' });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Google Sign-in failed.',
          description: authError.message,
        });
      }
    } finally {
        setIsGoogleLoading(false);
    }
  }

  if (isUserLoading || user) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {pendingCred && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Link Your Google Account</AlertTitle>
                <AlertDescription>
                  An account with this email already exists. Sign in with your password to link your Google account.
                </AlertDescription>
              </Alert>
            )}

            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
                Sign in with Google
            </Button>
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
        </CardContent>
        <form onSubmit={handleSignIn}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isGoogleLoading || isLoading}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isGoogleLoading || isLoading}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isGoogleLoading || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingCred ? "Sign In & Link" : "Sign In"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    