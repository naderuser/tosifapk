package com.nader.gradesapp.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nader.gradesapp.data.model.GradeItem
import com.nader.gradesapp.ui.theme.*
import com.nader.gradesapp.viewmodel.GradesViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(vm: GradesViewModel, onLoginRequest: () -> Unit = {}) {
    val grades by vm.grades.collectAsState()
    val clipboard = LocalClipboardManager.current

    vm.uiMessage?.let { msg ->
        LaunchedEffect(msg) {
            kotlinx.coroutines.delay(2500)
            vm.clearMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("📚 توصیف عملکرد", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("پایه‌های اول تا ششم | نادر اکشیک", fontSize = 11.sp, color = Color.White.copy(alpha = 0.8f))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg, titleContentColor = Color.White),
                actions = {
                    if (!vm.isTeacherLoggedIn) {
                        IconButton(onClick = onLoginRequest) {
                            Icon(Icons.Default.Lock, "لاگین", tint = Color.White)
                        }
                    } else {
                        IconButton(onClick = { vm.isEditMode = !vm.isEditMode }) {
                            Icon(if (vm.isEditMode) Icons.Default.EditOff else Icons.Default.Edit,
                                "ویرایش", tint = if (vm.isEditMode) OrangeEdit else Color.White)
                        }
                        IconButton(onClick = { vm.saveGrades() }) {
                            Icon(Icons.Default.Save, "ذخیره", tint = Color.White)
                        }
                        IconButton(onClick = { vm.logout() }) {
                            Icon(Icons.Default.ExitToApp, "خروج", tint = Color.White)
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).background(Color(0xFFF0F2FF))) {

            // Toast
            vm.uiMessage?.let { msg ->
                Surface(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = if (msg.contains("خطا")) Color(0xFFE53E3E) else GreenOk
                ) {
                    Text(msg, modifier = Modifier.padding(12.dp), color = Color.White,
                        fontWeight = FontWeight.Medium, textAlign = TextAlign.Center)
                }
            }

            // UUID Panel
            if (vm.isTeacherLoggedIn) UUIDPanel(vm)

            // Tabs
            ScrollableTabRow(selectedTabIndex = vm.selectedGrade - 1,
                containerColor = DarkBg, contentColor = Color.White, edgePadding = 8.dp) {
                listOf("اول","دوم","سوم","چهارم","پنجم","ششم").forEachIndexed { i, label ->
                    Tab(selected = vm.selectedGrade == i+1, onClick = { vm.selectedGrade = i+1 },
                        text = { Text("پایه $label", fontSize = 13.sp,
                            fontWeight = if (vm.selectedGrade == i+1) FontWeight.Bold else FontWeight.Normal) })
                }
            }

            if (vm.isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Purple)
                }
            } else {
                val grouped = vm.currentGradeItems().groupBy { it.subject }
                LazyColumn(Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    grouped.forEach { (subject, items) ->
                        item {
                            Text(subject, fontWeight = FontWeight.Bold, fontSize = 17.sp,
                                color = DarkBg, modifier = Modifier.padding(top = 8.dp, bottom = 2.dp))
                        }
                        items(items) { item ->
                            GradeCard(
                                item = item,
                                isEditMode = vm.isEditMode && vm.isTeacherLoggedIn,
                                onCopy = {
                                    clipboard.setText(AnnotatedString(item.desc))
                                    vm.uiMessage = "متن کپی شد ✅"
                                },
                                onDescChange = { vm.updateDesc(vm.selectedGrade.toString(), item.id, it) }
                            )
                        }
                    }
                    item { Spacer(Modifier.height(80.dp)) }
                }
            }
        }
    }
}

@Composable
fun UUIDPanel(vm: GradesViewModel) {
    var uuidInput by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current

    Card(Modifier.fillMaxWidth().padding(12.dp), shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(6.dp)) {
        Column(Modifier.padding(16.dp)) {
            if (vm.currentUUID.isNotBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Key, null, tint = Purple, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(vm.currentUUID, fontSize = 11.sp, color = TextMedium, modifier = Modifier.weight(1f))
                    IconButton(onClick = {
                        clipboard.setText(AnnotatedString(vm.currentUUID))
                        vm.uiMessage = "UUID کپی شد"
                    }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.ContentCopy, null, tint = Purple, modifier = Modifier.size(16.dp))
                    }
                }
                Spacer(Modifier.height(8.dp))
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { vm.generateUUID() },
                    colors = ButtonDefaults.buttonColors(containerColor = Purple),
                    shape = RoundedCornerShape(50.dp), modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(8.dp)) {
                    Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("UUID جدید", fontSize = 12.sp)
                }
                Button(onClick = { vm.saveGrades() },
                    colors = ButtonDefaults.buttonColors(containerColor = GreenOk),
                    shape = RoundedCornerShape(50.dp), modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(8.dp)) {
                    Icon(Icons.Default.Save, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("ذخیره", fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = uuidInput, onValueChange = { uuidInput = it },
                    label = { Text("UUID برای بارگذاری", fontSize = 12.sp) },
                    modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), singleLine = true,
                    textStyle = LocalTextStyle.current.copy(fontSize = 12.sp))
                Button(onClick = { vm.loadByUUID(uuidInput) },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4299E1)),
                    shape = RoundedCornerShape(12.dp), contentPadding = PaddingValues(12.dp)) {
                    Icon(Icons.Default.Search, null, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}

@Composable
fun GradeCard(item: GradeItem, isEditMode: Boolean, onCopy: () -> Unit, onDescChange: (String) -> Unit) {
    var editedDesc by remember(item.id) { mutableStateOf(item.desc) }

    Card(
        modifier = Modifier.fillMaxWidth().border(
            4.dp, levelColor(item.level),
            RoundedCornerShape(topEnd = 20.dp, bottomEnd = 20.dp, topStart = 4.dp, bottomStart = 4.dp)),
        shape = RoundedCornerShape(topEnd = 20.dp, bottomEnd = 20.dp, topStart = 4.dp, bottomStart = 4.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(4.dp)) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically) {
                Text(item.subject, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextDark)
                Surface(shape = RoundedCornerShape(50.dp), color = levelBgColor(item.level)) {
                    Text(item.levelText,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        fontSize = 11.sp, fontWeight = FontWeight.Bold, color = levelColor(item.level))
                }
            }
            Spacer(Modifier.height(10.dp))

            if (isEditMode) {
                OutlinedTextField(value = editedDesc, onValueChange = { editedDesc = it; onDescChange(it) },
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = OrangeEdit, unfocusedBorderColor = OrangeEdit.copy(alpha = 0.5f)),
                    textStyle = LocalTextStyle.current.copy(fontSize = 14.sp, lineHeight = 22.sp))
            } else {
                Text(item.desc, fontSize = 14.sp, lineHeight = 22.sp, color = TextDark, textAlign = TextAlign.Justify)
            }

            Spacer(Modifier.height(10.dp))
            OutlinedButton(onClick = onCopy, shape = RoundedCornerShape(50.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Purple),
                border = BorderStroke(1.5.dp, Purple),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)) {
                Icon(Icons.Default.ContentCopy, null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("کپی توصیف", fontSize = 13.sp)
            }
        }
    }
}
