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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nader.gradesapp.ui.theme.*

@Composable
fun LoginScreen(onLogin: (String) -> Boolean, onSkip: () -> Unit) {
    var password by remember { mutableStateOf("") }
    var showError by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()
        .background(Brush.verticalGradient(listOf(Purple, DarkPurple))),
        contentAlignment = Alignment.Center) {
        Card(Modifier.fillMaxWidth().padding(32.dp), shape = RoundedCornerShape(32.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(16.dp)) {
            Column(Modifier.padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.School, null, tint = Purple, modifier = Modifier.size(72.dp))
                Spacer(Modifier.height(16.dp))
                Text("پنل معلم", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TextDark)
                Text("رمز عبور را وارد کنید", fontSize = 14.sp, color = TextMedium,
                    modifier = Modifier.padding(top = 4.dp, bottom = 24.dp))

                OutlinedTextField(
                    value = password, onValueChange = { password = it; showError = false },
                    label = { Text("رمز عبور") },
                    leadingIcon = { Icon(Icons.Default.Lock, null) },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true, isError = showError,
                    supportingText = if (showError) {{ Text("رمز عبور اشتباه است!", color = MaterialTheme.colorScheme.error) }} else null,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { if (!onLogin(password)) showError = true }),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp))

                Spacer(Modifier.height(20.dp))
                Button(onClick = { if (!onLogin(password)) showError = true },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Purple)) {
                    Text("ورود به پنل", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(12.dp))
                TextButton(onClick = onSkip) {
                    Text("ادامه بدون لاگین", color = TextMedium, fontSize = 13.sp)
                }
            }
        }
    }
}
