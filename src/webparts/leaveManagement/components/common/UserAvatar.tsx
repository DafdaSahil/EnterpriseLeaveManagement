import * as React from "react";
import "./user-avatar.css";

interface IUserAvatarProps {
  /** Display name used for the initials fallback. */
  name?: string;
  /** Used as a fallback when no name is available. */
  email?: string;
  /** Server-relative URL of the employee photo, if any. */
  imageUrl?: string;
  /** Diameter in pixels. Defaults to 40. */
  size?: number;
  className?: string;
}

/** Returns initials from a display name, e.g. "Arjun Kumar" → "AK" */
const getInitials = (name?: string): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

/**
 * Renders the employee photo when one is set, falling back to
 * an initials block. Falls back again if the photo URL stops
 * resolving (e.g. the file was deleted from the library).
 */
const UserAvatar = ({
  name,
  email,
  imageUrl,
  size = 40,
  className,
}: IUserAvatarProps): JSX.Element => {
  const [imageFailed, setImageFailed] = React.useState<boolean>(false);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const label = name || email || "user";

  return (
    <div
      className={`avatar ${className || ""}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.32)),
      }}
      role="img"
      aria-label={showImage ? `Photo of ${label}` : `Avatar for ${label}`}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          onError={(): void => setImageFailed(true)}
        />
      ) : (
        getInitials(name || email)
      )}
    </div>
  );
};

export default UserAvatar;
