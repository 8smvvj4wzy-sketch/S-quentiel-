import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { exporterConfiguration, importerConfiguration, type ResultatImport } from '../db'

/**
 * Export / import de la configuration en JSON (SPEC §4.6), pour dupliquer
 * le paramétrage d'une tablette à l'autre sans tout ressaisir. Sont inclus
 * les pictos (image comprise, encodée en base64), séquences, activités,
 * règles, pages TLA et profils (EDT, TLA, réglages vocaux). Le code PIN de
 * la tablette et les cochages du jour ne sont pas exportés : le premier est
 * propre à chaque appareil, les seconds sont un état, pas une configuration.
 * L'import fusionne (remplace par id) sans rien effacer d'existant.
 */
export function ExportImport() {
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const entree = useRef<HTMLInputElement>(null)

  async function exporter() {
    setEnCours(true)
    setErreur(null)
    try {
      const json = await exporterConfiguration()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const lien = document.createElement('a')
      lien.href = url
      lien.download = `sequentiel-configuration-${new Date().toISOString().slice(0, 10)}.json`
      lien.click()
      URL.revokeObjectURL(url)
      setMessage('Fichier exporté.')
    } catch {
      setErreur("L'export a échoué.")
    } finally {
      setEnCours(false)
    }
  }

  async function importer(fichier: File | undefined) {
    if (!fichier) return
    setEnCours(true)
    setErreur(null)
    setMessage(null)
    try {
      const texte = await fichier.text()
      const resultat: ResultatImport = await importerConfiguration(texte)
      setMessage(
        `Importé : ${resultat.pictos} picto(s), ${resultat.sequences} séquence(s), ${resultat.activites} activité(s), ${resultat.regles} règle(s), ${resultat.pagesTLA} page(s) TLA, ${resultat.profils} profil(s).`,
      )
    } catch {
      setErreur("Ce fichier n'a pas pu être importé (format non reconnu).")
    } finally {
      setEnCours(false)
      if (entree.current) entree.current.value = ''
    }
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/parametrage" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Export / import de la configuration</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '36rem' }}>
        <p style={{ margin: 0 }}>
          Pour dupliquer le paramétrage d'une tablette à l'autre sans tout ressaisir : pictos,
          séquences, activités, règles, pages TLA et profils (emploi du temps, TLA, réglages
          vocaux). Le code PIN et les cochages du jour ne sont pas concernés.
        </p>

        <button type="button" className="bouton bouton--accent" style={{ width: 'fit-content' }} disabled={enCours} onClick={() => void exporter()}>
          Exporter la configuration
        </button>

        <label className="etiquette" htmlFor="import-fichier">
          Importer un fichier de configuration
        </label>
        <input
          id="import-fichier"
          ref={entree}
          type="file"
          accept=".json"
          className="champ"
          disabled={enCours}
          onChange={(e) => void importer(e.target.files?.[0])}
        />
        <p style={{ margin: 0, fontSize: 14, color: 'var(--texte-secondaire)' }}>
          L'import fusionne avec ce qui existe déjà sur cette tablette, sans rien effacer.
        </p>

        {message && <p style={{ margin: 0, color: 'var(--fait)', fontWeight: 700 }}>{message}</p>}
        {erreur && <p style={{ margin: 0, color: 'var(--alerte)', fontWeight: 700 }}>{erreur}</p>}
      </div>
    </div>
  )
}
