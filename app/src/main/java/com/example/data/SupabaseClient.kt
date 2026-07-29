package com.example.data

import com.example.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import io.ktor.client.engine.okhttp.OkHttp

/**
 * Shared client for the "dearadeline-withlove" Supabase project, the same
 * Postgres database the web app uses. Auth session state and Postgrest
 * queries both flow through this one instance.
 */
object SupabaseClientProvider {
    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            httpEngine = OkHttp.create()
            install(Postgrest)
            install(Auth)
        }
    }

    val auth get() = client.auth
    val postgrest get() = client.postgrest
}
