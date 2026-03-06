import logo from '../../../assets/logo.png'
import { useI18n } from '../../../i18n'

function AddressIcon() {
  return (
    <svg aria-hidden="true" className="contact-icon-svg" viewBox="0 0 24 24">
      <path
        d="M12 21c-3.4-3.5-6-6.6-6-10a6 6 0 1 1 12 0c0 3.4-2.6 6.5-6 10Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" fill="none" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="contact-icon-svg" viewBox="0 0 24 24">
      <path
        d="M7.8 5.5c.7-1 2-.8 2.6.2l1.1 1.8c.4.7.3 1.6-.3 2.1l-1 1c1.1 2 2.7 3.6 4.7 4.7l1-1c.6-.6 1.4-.7 2.1-.3l1.8 1.1c1 .6 1.2 1.9.2 2.6l-1.2.9c-.8.6-1.9.8-2.8.4-5.6-2.2-9.6-6.2-11.8-11.8-.4-.9-.2-2 .4-2.8Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="contact-icon-svg" viewBox="0 0 24 24">
      <circle cx="12" cy="13" fill="none" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 9.8v3.6h2.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.4 3.8 6.8 5.5M15.6 3.8l1.6 1.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function VetContactSection() {
  const { t } = useI18n()

  return (
    <section className="contact-showcase">
      <div className="contact-brand">
        <img alt={t('vetContact.logoAlt')} className="contact-logo-image" src={logo} />
      </div>

      <div aria-hidden="true" className="contact-divider" />

      <div className="contact-details">
        <article className="contact-item">
          <span className="contact-icon-shell">
            <AddressIcon />
          </span>
          <div className="contact-copy">
            <h3>
              <span className="contact-title-inline">{t('vetContact.addressTitle')}</span>
            </h3>
            <p>{t('vetContact.addressLine1')}</p>
            <p>{t('vetContact.addressLine2')}</p>
          </div>
        </article>

        <article className="contact-item">
          <span className="contact-icon-shell">
            <PhoneIcon />
          </span>
          <div className="contact-copy">
            <h3>
              <span className="contact-title-inline">{t('vetContact.phoneTitle')}</span>
            </h3>
            <p>{t('vetContact.phoneLine1')}</p>
            <p>{t('vetContact.phoneLine2')}</p>
          </div>
        </article>

        <article className="contact-item">
          <span className="contact-icon-shell">
            <ClockIcon />
          </span>
          <div className="contact-copy">
            <h3>
              <span className="contact-title-inline">{t('vetContact.hoursTitle')}</span>
            </h3>
            <p>{t('vetContact.hoursLine1')}</p>
            <p>{t('vetContact.hoursLine2')}</p>
          </div>
        </article>
      </div>
    </section>
  )
}
