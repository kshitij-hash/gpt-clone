'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { Provider } from '@supabase/supabase-js'
import { getURL } from '@/utils/helpers'

export async function emailLogin(formData: FormData) {
    const supabase = createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/chat')
}

export async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/signin');
}

export async function oAuthSignIn(provider: Provider) {
    if(!provider) {
        return redirect('/error');
    }

    const supabase = createClient();
    const redirectUrl = getURL('/api/auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl
        }
    })

    if(error) {
        redirect('/error');
    }

    return redirect(data.url);
}