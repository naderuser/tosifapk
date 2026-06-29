package com.nader.gradesapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nader.gradesapp.ui.theme.*

@Composable
fun SetupScreen(onSave: (String) -> Unit) {
    var url by remember { mutableStateOf("https://") }
    var showError by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf("") }

    fun validate(): Boolean = when {
        url.isBlank() -> { errorMsg = "آدرس را وارد کنید"; showError = true; false }
        !url.startsWith("https://") -> { errorMsg = "آدرس باید با https:// شروع شود"; showError = true; false }
        else -> { showError = false; true }
    }

    Box(
        modifier = Modifier.fillMaxSize()
            .background(Brush.verticalGradient(listOf(DarkBg, DarkPurple))),
        contentAlignment = Alignment.Center
    ) {
        Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Default.School, null, tint = Color.White, modifier = Modifier.size(80.dp))
            Spacer(Modifier.height(8.dp))
            Text("📚 توصیف عملکرد", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text("پایه‌های اول تا ششم | نادر اکشیک", fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.7f), modifier = Modifier.padding(top = 4.dp, bottom = 28.dp))

            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(16.dp)) {
                Column(Modifier.padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Link, null, tint = Purple, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("آدرس ورکر", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextDark)
                    Text("آدرس Cloudflare Worker خود را وارد کنید", fontSize = 13.sp,
                        color = TextMedium, textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp, bottom = 20.dp))

                    OutlinedTextField(
                        value = url, onValueChange = { url = it; showError = false },
                        label = { Text("آدرس ورکر") },
                        placeholder = { Text("https://my-worker.workers.dev", fontSize = 12.sp) },
                        leadingIcon = { Icon(Icons.Default.Language, null, tint = Purple) },
                        isError = showError,
                        supportingText = {
                            if (showError) Text(errorMsg, color = MaterialTheme.colorScheme.error)
                            else Text("مثال: https://my-app.workers.dev", color = TextMedium, fontSize = 11.sp)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { if (validate()) onSave(url.trimEnd('/')) }),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Purple, focusedLabelColor = Purple)
                    )

                    Spacer(Modifier.height(20.dp))
                    Button(onClick = { if (validate()) onSave(url.trimEnd('/')) },
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Purple)) {
                        Icon(Icons.Default.ArrowForward, null, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("ادامه", fontSize = 17.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(Modifier.height(16.dp))
                    Surface(shape = RoundedCornerShape(12.dp), color = Color(0xFFEBF8FF)) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
                            Icon(Icons.Default.Info, null, tint = Color(0xFF3182CE), modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("آدرس فقط یک‌بار وارد می‌شود و ذخیره می‌گردد.",
                                fontSize = 12.sp, color = Color(0xFF2B6CB0), lineHeight = 18.sp)
                        }
                    }
                }
            }
        }
    }
}
