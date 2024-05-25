"use client"
import { Button } from "@/components/ui/button"
import { Provider } from "@supabase/supabase-js"
import { FaGoogle } from 'react-icons/fa'
import { oAuthSignIn } from "./actions"

type OAuthProvider = {
    name: Provider,
    displayName: string,
    icon?: JSX.Element
}

export function OAuthButtons() {
    const oAuthProviders: OAuthProvider[] = [{
        name: 'google',
        displayName: "Google",
        icon: <FaGoogle className="size-5" />
    }]
    
    return (
        <>
            { oAuthProviders.map(provider => (
                <Button
                key={provider.name} 
                variant="outline"
                className="w-full flex items-center justify-center gap-2" 
                onClick={async () => {
                    await oAuthSignIn(provider.name);
                }}
                >
                    {provider.icon}
                    Continue with {provider.displayName}
                </Button>
            ))}
        </>
    )
}
