import styles from './TokenAvatar.module.css';

type Props = {
  emoji?: string;
  color: string;
  size?: number;
  imageUrl?: string;
  alt?: string;
};

export function TokenAvatar({
  emoji = '🪙',
  color,
  size = 40,
  imageUrl,
  alt = '',
}: Props) {
  if (imageUrl) {
    return (
      <img
        className={styles.avatarImg}
        src={imageUrl}
        alt={alt}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.48,
        background: `linear-gradient(135deg, ${color}55, ${color}22)`,
        borderColor: `${color}66`,
      }}
      aria-hidden
    >
      {emoji}
    </div>
  );
}
