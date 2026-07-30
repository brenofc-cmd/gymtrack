# Login Google

No Google Auth Platform, use audiência **External** e publique o app; em modo de teste, inclua cada conta em **Test users**. Configure apenas `openid`, `userinfo.email` e `userinfo.profile`.

Em Authorized JavaScript origins, inclua `http://localhost:3000` e o domínio real do GymTrack. Em Authorized redirect URIs, inclua `https://ID-DO-PROJETO.supabase.co/auth/v1/callback` (o callback do Supabase, não somente o callback Next.js).

No Supabase, habilite Google, informe Client ID e Client Secret somente no Dashboard, defina a Site URL de produção e adicione `/auth/callback` para localhost e domínio de produção em Redirect URLs. Nunca exponha o Client Secret no frontend.
