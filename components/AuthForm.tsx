"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomInput from './ui/CustomInput';
import { cn, authFormSchema } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner"
import PlaidLink from './PlaidLink';

const AuthForm = ({type}: {type: string}) => {
  const [user, setUser] =useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
     
    const formSchema = authFormSchema(type);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstname: "",
      lastname: "",
      address: "",
      city: "",
      state: "",
      postalcode: "",
      dob: "",
      ssn: "",
    },
  })


 const onSubmit = async (data: z.infer<typeof formSchema>) => {
   setIsLoading(true);
    if (type == 'sign-up') {
     try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: { message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'Unable to create your account.');
      }

      form.reset();
      toast.success(result.message ?? "Account created successfully.", {
        position: "top-right",
      });
      router.push('/sign-in');
    }
    catch (error: unknown) {
      console.error(
        "Sign-up request failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      toast.error(
        error instanceof Error ? error.message : "Unable to create your account.",
        { position: "top-right" },
      );
    } finally {
      setIsLoading(false);
    }
  }
   if(type === 'sign-in') {
      try {
        const response = await fetch('/api/auth/sign-in', {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        })

        const result: { message?: string, status?: number } = await response.json();
        if (!response.ok) {
          toast.error(result.message ?? "Unable to sign in.", {
            position: "top-right",
          });
          return;
        }

        if(response.status === 200){
          router.replace("/");
          router.refresh();
        }
      }
      catch(error) {
        console.error("Sign-in request failed:", error);
        toast.error("Unable to sign in right now.", {
          position: "top-right",
        });
      } finally {
        setIsLoading(false);
      }
  };

 }

  return (
    <section className="auth-form">
  <header className="flex flex-col gap-2 md:gap-8">
    <Link href="/" className="flex mb-12 cursor-pointer items-center gap-1">
        <Image src="/icons/logo.svg" width={34} height={34} alt="Horizon logo" />
        <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">Horizon</h1>
        </Link>
        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {user ? 'Link Account': type === 'sign-in' ? 'Sign In' : 'Sign Up'}
           <p className="text-16 font-normal text-gray-600">
            {user ? "Link your account to get started": 'Please enter your details'}
           </p>
          </h1>
        </div>
  </header>
  {user ? (
    <div className="flex flex-col gap-4">
        <PlaidLink user={user} variant="primary" />

        </div>
  ): (
    <>
      <Card className="w-full sm:max-w-md border-none ring-0! bg-white!">
      <CardContent className="flex flex-col border-none ring-0! bg-white!">
        <form id="form-rhf-input" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {type === 'sign-up' && (
          <>
          <div className='flex gap-4'>
            <CustomInput control={form.control} name="firstname" label="First Name" placeholder="Enter your First Name"  />
            <CustomInput control={form.control} name="lastname" label="Last Name" placeholder="Enter your Last Name"  />
            </div>
            <CustomInput control={form.control} name="address" label="Address" placeholder="Enter your specific address"  />
            <CustomInput control={form.control} name="city" label="City" placeholder="Enter your city" />
            <div className='flex gap-4'>
            <CustomInput control={form.control} name="state" label="State" placeholder="Example: NY"  />
            <CustomInput control={form.control} name="postalcode" label="Postal Code" placeholder="5-digit US ZIP code" />
            </div>
             <div className='flex gap-4'>
            <CustomInput control={form.control} name="dob" label="Date of Birth" placeholder="YYYY-MM-DD"  />
            <CustomInput control={form.control} name="ssn" label="SSN" placeholder="1234"  />
         </div>
          </>

        )}

        <CustomInput control={form.control} name="email" label="Email" placeholder="Enter your email"  />
        <CustomInput control={form.control} name="password" label="Password" placeholder="Enter your password" />
        </form>
        <CardFooter className="border-none ring-0 bg-white flex mt-4 flex-col w-full gap-3">
       
         
          <Button type="submit" disabled={isLoading} className={cn("form-btn", user ? "w-[110%]": "w-[110%]")}  form="form-rhf-input">
           {isLoading ? (
            <>
            <Loader2 size={20} className='animate-spin' /> &nbsp;
            Loading...
            </>
           ): type === 'sign-in' ? "sign-in": 'Sign Up'}
          </Button>
          <footer className='flex justify-center gap-1'>
        <p className='text-14 font-normal text-gray-600'>{type === 'sign-in' ? "Don't have an account?" : "Already have an account ?"}</p>
        <Link href={type === "sign-in" ? '/sign-up': '/sign-in'} className='form-link'>
        {type === 'sign-in' ? 'Sign up' : 'Sign In'}
        </Link>
      </footer>
      </CardFooter>
      </CardContent>
      
    </Card>
    </>
  )}

    </section>
  )
}


export default AuthForm;
