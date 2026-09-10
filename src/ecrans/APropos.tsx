import { Link } from 'react-router-dom'

/** SPEC §4 / CLAUDE.md — l'attribution ARASAAC est obligatoire. */
export function APropos() {
  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">À propos</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Pictogrammes</h2>
          <p style={{ margin: 0 }}>
            Les pictogrammes utilisés sont la propriété du Gouvernement d'Aragon et ont
            été créés par Sergio Palao pour ARASAAC (<span>arasaac.org</span>), qui les
            distribue sous licence Creative Commons BY-NC-SA.
          </p>
          <p style={{ margin: 0, color: 'var(--texte-secondaire)', fontSize: 18 }}>
            Usage non commercial uniquement.
          </p>
        </section>

        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Police</h2>
          <p style={{ margin: 0 }}>
            Atkinson Hyperlegible, créée par la Braille Institute of America, distribuée
            sous SIL Open Font License.
          </p>
        </section>

        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Données</h2>
          <p style={{ margin: 0 }}>
            Tout reste dans cette tablette. Aucune donnée n'est envoyée sur internet,
            aucune synchronisation entre appareils. L'application fonctionne sans wifi.
          </p>
        </section>
      </div>
    </div>
  )
}
