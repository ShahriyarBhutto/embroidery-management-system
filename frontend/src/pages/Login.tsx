import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Scissors, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authApi } from "@/api";
import { useAuthStore } from "@/store/authStore";

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const result = await authApi.login(data.email, data.password);
      setAuth(result.access_token, result.refresh_token, result.user);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <Scissors className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Embroidery Manager</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@embroidery.com"
                {...register("email", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", { required: true })}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
