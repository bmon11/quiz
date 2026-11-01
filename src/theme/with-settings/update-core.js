import { setFont, hexToRgbChannel, createPaletteChannel } from 'minimal-shared/utils';

import { themeConfig } from '../theme-config';
import { primaryColorPresets } from './color-presets';
import { createShadowColor } from '../core/custom-shadows';

// ----------------------------------------------------------------------

/**
 * Update the core theme with the settings state.
 * @contrast
 * @primaryColor
 */

export function updateCoreWithSettings(theme, settingsState) {
  // Апп зөвхөн LTR, нэг фонттой (Inter — кирилл/кирилл-ext дэмждэг). Хуучин
  // cookie-д хадгалагдсан direction/fontFamily тохиргоог үл тооно.
  const { direction, fontFamily } = themeConfig;
  const { contrast = 'default', primaryColor = 'default' } = settingsState ?? {};

  const isDefaultContrast = contrast === 'default';
  const isDefaultPrimaryColor = primaryColor === 'default';

  const lightPalette = theme.colorSchemes?.light.palette;

  const updatedPrimaryColor = createPaletteChannel(primaryColorPresets[primaryColor]);
  // const updatedSecondaryColor = createPaletteChannel(SECONDARY_COLORS[primaryColor!]);

  const updateColorScheme = (scheme) => {
    const colorSchemes = theme.colorSchemes?.[scheme];

    const updatedPalette = {
      ...colorSchemes?.palette,
      ...(!isDefaultPrimaryColor && {
        primary: updatedPrimaryColor,
        // secondary: updatedSecondaryColor,
      }),
      ...(scheme === 'light' && {
        background: {
          ...lightPalette?.background,
          ...(!isDefaultContrast && {
            default: lightPalette.grey[200],
            defaultChannel: hexToRgbChannel(lightPalette.grey[200]),
          }),
        },
      }),
    };

    const updatedCustomShadows = {
      ...colorSchemes?.customShadows,
      ...(!isDefaultPrimaryColor && {
        primary: createShadowColor(updatedPrimaryColor.mainChannel),
        // secondary: createShadowColor(updatedSecondaryColor.mainChannel),
      }),
    };

    return {
      ...colorSchemes,
      palette: updatedPalette,
      customShadows: updatedCustomShadows,
    };
  };

  return {
    ...theme,
    direction,
    colorSchemes: {
      light: updateColorScheme('light'),
      dark: updateColorScheme('dark'),
    },
    typography: {
      ...theme.typography,
      fontFamily: setFont(fontFamily.primary),
    },
  };
}
