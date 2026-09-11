import { useObjectUrl } from '../lib/useObjectUrl'

type Props = {
  image: Blob | string // Blob pour un Picto obtenu, URL pour une entrée de catalogue
  libelle: string
  surAppui: () => void
  enCours?: boolean
  discret?: boolean // catalogue pas encore obtenu : légèrement estompé
}

/** Vignette carrée, cible tactile ≥ 64 px (CLAUDE.md §4). */
export function TuilePicto({ image, libelle, surAppui, enCours, discret }: Props) {
  const urlBlob = useObjectUrl(typeof image === 'string' ? undefined : image)
  const src = typeof image === 'string' ? image : urlBlob

  return (
    <button
      type="button"
      className="bouton"
      onClick={surAppui}
      disabled={enCours}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        // minHeight et non height : dans une colonne flex à hauteur fixe, le
        // libellé se fait comprimer et se coupe en silence (« sac à » pour
        // « sac à dos »). La vignette s'étire, elle ne rogne pas.
        minHeight: 132,
        opacity: discret ? 0.55 : 1,
      }}
      title={libelle}
    >
      <span
        style={{
          width: 72,
          height: 72,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--fond)',
          overflow: 'hidden',
        }}
      >
        {src ? (
          <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} />
        ) : (
          '…'
        )}
      </span>
      <span
        style={{
          fontSize: 14,
          lineHeight: 1.2,
          textAlign: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflowWrap: 'anywhere',
        }}
      >
        {libelle}
      </span>
    </button>
  )
}
