package com.example

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.EmilysCandyFontFamily
import com.example.ui.theme.PlusJakartaSansFamily

@Composable
fun OnboardingScreen(onStartAdventure: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.weight(1f))
        
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.Start
        ) {
            Text(
                text = "Where Learning Comes Alive...",
                fontFamily = EmilysCandyFontFamily,
                color = MaterialTheme.colorScheme.secondary,
                fontSize = 18.sp,
                fontStyle = FontStyle.Italic,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            Text(
                text = "Education",
                fontFamily = EmilysCandyFontFamily,
                color = MaterialTheme.colorScheme.primary,
                fontSize = 64.sp,
                lineHeight = 64.sp
            )
            Text(
                text = "as",
                fontFamily = EmilysCandyFontFamily,
                color = MaterialTheme.colorScheme.primary,
                fontSize = 32.sp,
                lineHeight = 32.sp
            )
            Text(
                text = "Unique",
                fontFamily = EmilysCandyFontFamily,
                color = MaterialTheme.colorScheme.secondary,
                fontSize = 60.sp,
                lineHeight = 60.sp
            )
            Text(
                text = "as Your",
                fontFamily = EmilysCandyFontFamily,
                color = MaterialTheme.colorScheme.primary,
                fontSize = 52.sp,
                lineHeight = 52.sp
            )
            Text(
                text = "Child",
                fontFamily = EmilysCandyFontFamily,
                color = MaterialTheme.colorScheme.primary,
                fontSize = 64.sp,
                lineHeight = 64.sp
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = onStartAdventure,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.align(Alignment.Start)
        ) {
            Text(
                "Start Your Adventure Today!",
                color = MaterialTheme.colorScheme.onPrimary,
                fontFamily = PlusJakartaSansFamily,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }
        
        Spacer(modifier = Modifier.weight(1.5f))
        
        Image(
            painter = painterResource(id = com.example.R.drawable.adeline_original),
            contentDescription = "Adeline and student",
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .clip(RoundedCornerShape(24.dp))
        )
        
        Spacer(modifier = Modifier.weight(0.5f))
    }
}
