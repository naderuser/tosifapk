package com.nader.gradesapp.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Purple     = Color(0xFF667EEA)
val DarkPurple = Color(0xFF764BA2)
val GreenOk    = Color(0xFF48BB78)
val YellowWarn = Color(0xFFECC94B)
val RedBad     = Color(0xFFFC8181)
val GrayNeed   = Color(0xFFA0AEC0)
val DarkBg     = Color(0xFF1A1A2E)
val TextDark   = Color(0xFF2D3748)
val TextMedium = Color(0xFF4A5568)
val OrangeEdit = Color(0xFFED8936)

private val AppColorScheme = lightColorScheme(
    primary    = Purple,
    onPrimary  = Color.White,
    secondary  = DarkPurple,
    background = Color(0xFFF0F2FF),
    surface    = Color.White,
    onBackground = TextDark,
    onSurface  = TextDark,
)

@Composable
fun GradesAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = AppColorScheme, content = content)
}

fun levelColor(level: String): Color = when (level) {
    "level-excellent"  -> GreenOk
    "level-good"       -> YellowWarn
    "level-acceptable" -> RedBad
    else               -> GrayNeed
}

fun levelBgColor(level: String): Color = when (level) {
    "level-excellent"  -> Color(0xFFC6F6D5)
    "level-good"       -> Color(0xFFFEFCBF)
    "level-acceptable" -> Color(0xFFFED7D7)
    else               -> Color(0xFFE2E8F0)
}
