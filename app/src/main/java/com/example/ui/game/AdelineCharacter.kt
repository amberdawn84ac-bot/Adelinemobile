package com.example.ui.game

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.R

/**
 * Adeline herself, drawn from the illustrated character art rather than
 * synthesised shapes. Tapping her is the app's "talk to Adeline" gesture, so
 * the whole figure acts as one large touch target.
 */
@Composable
fun AdelineCharacter(
    onTalk: () -> Unit,
    modifier: Modifier = Modifier,
    height: Dp = 220.dp,
    animate: Boolean = true,
    contentDescription: String = "Talk to Adeline"
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()

    // A slow idle bob keeps her feeling alive without pulling focus.
    val bob = if (animate) {
        val transition = rememberInfiniteTransition(label = "adeline-idle")
        transition.animateFloat(
            initialValue = 0f,
            targetValue = -6f,
            animationSpec = infiniteRepeatable(
                animation = tween(2600),
                repeatMode = RepeatMode.Reverse
            ),
            label = "adeline-bob"
        ).value
    } else {
        0f
    }

    // Keep her from eating a short landscape window on a phone; on a tablet the
    // requested height is used as-is.
    val screenHeight = LocalConfiguration.current.screenHeightDp.dp
    val cap = screenHeight * 0.42f
    val resolvedHeight = if (height > cap) cap else height

    Image(
        painter = painterResource(R.drawable.adeline_character),
        contentDescription = contentDescription,
        contentScale = ContentScale.Fit,
        modifier = modifier
            .height(resolvedHeight)
            .graphicsLayer {
                translationY = bob
                val press = if (pressed) 0.94f else 1f
                scaleX = press
                scaleY = press
            }
            .selectable(
                selected = false,
                interactionSource = interaction,
                indication = null,
                role = Role.Button,
                onClick = onTalk
            )
    )
}

/** Adeline's portrait, used as the speaker avatar on the quest card. */
@Composable
fun AdelinePortrait(modifier: Modifier = Modifier, size: Dp = 76.dp) {
    Surface(
        modifier = modifier.size(size),
        shape = CircleShape,
        color = MaterialTheme.colorScheme.surfaceVariant,
        tonalElevation = 2.dp
    ) {
        Image(
            painter = painterResource(R.drawable.adeline_portrait),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
        )
    }
}
