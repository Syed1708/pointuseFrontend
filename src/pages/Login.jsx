import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiZap, FiGithub } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import api from '../services/api';
import { setCredentials } from '../store/authSlice';

// 1. Zod Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  // 2. Connect React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // 3. Handle Form Submission
  const onSubmit = async (data) => {
    setApiError('');
    try {
      const res = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.data.accessToken,
      }));

      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Invalid credentials or connection error.');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      {/* Subtle Background Grid Grid decoration (Shadcn Style) */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <div className="w-full max-w-[400px] space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {/* Header Block */}
        <div className="flex flex-col space-y-2 text-center">
          {/* Logo */}
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-sm">
            <FiZap className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500">
            Enter your email below to sign in to your account
          </p>
        </div>

        {/* API Error Box */}
        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 transition duration-150">
            {apiError}
          </div>
        )}

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => alert('Social Auth not configured')}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] transition"
          >
            <FcGoogle className="mr-2 h-4 w-4" /> Google
          </button>
          <button
            type="button"
            onClick={() => alert('Social Auth not configured')}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] transition"
          >
            <FiGithub className="mr-2 h-4 w-4 text-zinc-900" /> GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <span className="relative bg-white px-3 text-xs uppercase text-zinc-400 font-medium">
            Or continue with
          </span>
        </div>

        {/* Form Block */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@company.com"
                  className={`w-full rounded-lg border bg-white py-2 pl-9 pr-4 text-sm shadow-sm transition placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 ${
                    errors.email ? 'border-red-400' : 'border-zinc-200'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Password
                </label>
                <a href="#forgot" className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`w-full rounded-lg border bg-white py-2 pl-9 pr-4 text-sm shadow-sm transition placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 ${
                    errors.password ? 'border-red-400' : 'border-zinc-200'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm hover:bg-zinc-800 active:scale-[0.98] transition disabled:bg-zinc-500"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          By clicking continue, you agree to our{' '}
          <a href="#terms" className="underline hover:text-zinc-900">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#privacy" className="underline hover:text-zinc-900">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}