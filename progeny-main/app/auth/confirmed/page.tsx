import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ConfirmedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
            <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-primary-foreground font-bold text-xl">P</span>
                        </div>
                        <span className="font-bold text-2xl tracking-tight">Progeny AI</span>
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-foreground">Account Verified! 🎉</CardTitle>
                    <CardDescription className="text-lg mt-2">Your email has been successfully confirmed.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-8">
                    <div className="text-7xl animate-bounce mt-4">✅</div>
                    <p className="text-muted-foreground text-base leading-relaxed">
                        Thank you for joining Progeny AI. Your account is now active and ready to use.
                        You can now return to the mobile app and sign in with your credentials.
                    </p>
                    <div className="pt-4 border-t border-border/50">
                        <p className="text-sm font-medium text-muted-foreground mb-4 italic">
                            "Help your plants grow better with Progeny AI"
                        </p>
                        <Button asChild className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-all">
                            <Link href="/signin">Sign In on Web</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
