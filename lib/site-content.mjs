export const siteDescription = 'Custom spiral bevel, helical, spur and gear sets. Send your drawings to Vijaya Engineering Works for a manufacturing quote.'
export const pageTitles = { home: 'Custom Gear Manufacturing', products: 'Gears & Products', capabilities: 'Manufacturing Capabilities', gallery: 'Gear Gallery', about: 'About Us', contact: 'Contact Us', login: 'Sign In', rfq: 'Request a Quote', portal: 'Your RFQs & Orders', admin: 'Business Dashboard', invite: 'Company Invitation' }
export function cleanContact(cms) {
  const content = { ...(cms || {}) }
  if (content.email === 'sales@vew.com') content.email = ''
  if (content.phone === '+91 98765 43210') content.phone = ''
  if (content.address?.includes('15 Industrial Estate')) content.address = ''
  return content
}
