/**
 * Developer ID 서명 후 Apple 공증(notarization).
 * 자격 증명이 없으면 건너뜁니다 (unsigned 빌드 유지).
 *
 * 필요 환경변수 (GitHub Secrets 권장):
 * - APPLE_ID
 * - APPLE_APP_SPECIFIC_PASSWORD
 * - APPLE_TEAM_ID
 *
 * 또는 App Store Connect API Key:
 * - APPLE_API_KEY (키 파일 경로 또는 내용)
 * - APPLE_API_KEY_ID
 * - APPLE_API_ISSUER
 */
exports.default = async function notarizeMac(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const hasAppleId =
    Boolean(process.env.APPLE_ID) &&
    Boolean(process.env.APPLE_APP_SPECIFIC_PASSWORD) &&
    Boolean(process.env.APPLE_TEAM_ID)
  const hasApiKey =
    Boolean(process.env.APPLE_API_KEY) &&
    Boolean(process.env.APPLE_API_KEY_ID) &&
    Boolean(process.env.APPLE_API_ISSUER)

  if (!hasAppleId && !hasApiKey) {
    console.log(
      '[notarize] Skipped — no Apple credentials. Unsigned/ad-hoc builds will show Gatekeeper “damaged” until signed+notarized.',
    )
    return
  }

  // identity:null / CSC_IDENTITY_AUTO_DISCOVERY=false 로 서명 안 된 경우 공증 불가
  if (
    process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false' ||
    process.env.CSC_IDENTITY === 'null'
  ) {
    console.log('[notarize] Skipped — code signing is disabled for this build.')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`
  console.log(`[notarize] Notarizing ${appPath}`)

  const { notarize } = await import('@electron/notarize')

  if (hasApiKey) {
    await notarize({
      appPath,
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER,
    })
  } else {
    await notarize({
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    })
  }

  console.log('[notarize] Done')
}
