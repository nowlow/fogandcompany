import { startSignIn } from "@/actions/auth";
import { enabledProviders } from "@/lib/auth";

function ProviderMark({ id }: { id: string }) {
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 11v3.2h4.6a4 4 0 0 1-1.7 2.6l2.7 2.1c1.6-1.5 2.5-3.7 2.5-6.3 0-.6 0-1.1-.2-1.6H12Z"
        />
        <path
          fill="currentColor"
          opacity=".72"
          d="M12 21c2.4 0 4.4-.8 5.9-2.1l-2.8-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8l-2.9 2.2A9 9 0 0 0 12 21Z"
        />
        <path
          fill="currentColor"
          opacity=".5"
          d="M6.9 13.7a5.4 5.4 0 0 1 0-3.4L4 8.1a9 9 0 0 0 0 8l2.9-2.4Z"
        />
        <path
          fill="currentColor"
          opacity=".85"
          d="M12 6.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 4 8.1L6.9 10c.7-2.1 2.7-3.7 5.1-3.7Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

const LABEL: Record<string, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

export function SignIn({ next = "/stay" }: { next?: string }) {
  if (!enabledProviders.length) {
    return (
      <p className="border-l-2 border-orange py-2 pl-3 text-sm text-orange-deep">
        No sign-in provider is configured yet. Add Google or GitHub credentials
        to the environment and redeploy.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {enabledProviders.map((provider, i) => (
        <form action={startSignIn} key={provider.id} className="w-full">
          <input type="hidden" name="provider" value={provider.id} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className={`btn w-full ${i > 0 ? "btn-ghost" : ""}`}
          >
            <ProviderMark id={provider.id} />
            {LABEL[provider.id] ?? `Continue with ${provider.name}`}
          </button>
        </form>
      ))}
    </div>
  );
}
