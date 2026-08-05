interface AuthHeadingProps {
  title: string;
  description: string;
}

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <div className="space-y-2 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
        {title}
      </h1>

      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );
}
