import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone, Upload, PenSquare } from "lucide-react"

export default function GettingStarted({ twilioPhoneNumber }: { twilioPhoneNumber?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>How to add stats to your teams.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-4">
          <Smartphone className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Option 1: SMS Upload (Easiest)</h3>
            <p className="text-sm text-muted-foreground">
              Text a picture of your scorebook to the number below. The AI will handle the rest.
            </p>
            {twilioPhoneNumber ? (
              <p className="text-sm font-mono mt-2 bg-muted p-2 rounded-md inline-block">{twilioPhoneNumber}</p>
            ) : (
              <p className="text-sm text-amber-600 mt-2">
                SMS number is not configured. Set TWILIO_PHONE_NUMBER in your environment.
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Remember to include your team's unique SMS code (found in team settings) as the first word in your
              message.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Upload className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Option 2: Manual Upload</h3>
            <p className="text-sm text-muted-foreground">
              Go to any team page, navigate to the "Games & Entry" tab, and use the "Upload Image" option to submit a
              scorebook from your computer.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <PenSquare className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Option 3: Manual Entry</h3>
            <p className="text-sm text-muted-foreground">
              For full control, you can also enter stats manually in the "Games & Entry" tab on any team page.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
