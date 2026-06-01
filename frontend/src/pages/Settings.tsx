import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Plus, X, Loader2 } from "lucide-react";
import { settingsApi } from "@/api";
import type { ReportConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDate } from "@/lib/utils";

export default function Settings() {
  const qc = useQueryClient();
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [sendDay, setSendDay] = useState(1);
  const [sendTime, setSendTime] = useState("08:00");
  const [isActive, setIsActive] = useState(true);
  const [testMsg, setTestMsg] = useState("");
  const [testError, setTestError] = useState("");

  const { data: config, isLoading } = useQuery({ queryKey: ["report-config"], queryFn: settingsApi.getConfig });

  useEffect(() => {
    if (config) {
      setEmails(config.recipient_emails || []);
      setSendDay(config.send_day);
      setSendTime(config.send_time);
      setIsActive(config.is_active);
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ReportConfig>) => settingsApi.updateConfig(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-config"] }),
  });

  const testMutation = useMutation({
    mutationFn: settingsApi.testReport,
    onSuccess: () => { setTestMsg("Test report sent successfully!"); setTestError(""); },
    onError: (e: unknown) => { setTestError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to send"); setTestMsg(""); },
  });

  const addEmail = () => {
    const trimmed = newEmail.trim();
    if (trimmed && !emails.includes(trimmed)) { setEmails([...emails, trimmed]); setNewEmail(""); }
  };

  const removeEmail = (email: string) => setEmails(emails.filter((e) => e !== email));

  const handleSave = () => updateMutation.mutate({ recipient_emails: emails, send_day: sendDay, send_time: sendTime, is_active: isActive });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Email Report</CardTitle>
          <CardDescription>Configure automated monthly business reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable automated reports</Label>
              <p className="text-sm text-muted-foreground">Send a monthly report on the configured day</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label>Recipient Emails</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
              />
              <Button type="button" variant="outline" onClick={addEmail}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <div key={email} className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1 text-sm">
                  {email}
                  <button onClick={() => removeEmail(email)} className="ml-1 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {emails.length === 0 && <p className="text-sm text-muted-foreground">No recipients added</p>}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Send Day (of month)</Label>
              <Select value={String(sendDay)} onValueChange={(v) => setSendDay(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Send Time</Label>
              <Input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
            </div>
          </div>

          {/* Last sent */}
          {config?.last_sent_at && (
            <p className="text-sm text-muted-foreground">Last sent: {formatDate(config.last_sent_at)}</p>
          )}

          {/* Feedback */}
          {testMsg && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 rounded-md">{testMsg}</p>}
          {testError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-md">{testError}</p>}
          {updateMutation.isSuccess && <p className="text-sm text-emerald-600">Configuration saved.</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending || emails.length === 0}>
              {testMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Test Report Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
