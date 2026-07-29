package com.example.ui.game

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.util.Log
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.sin

/**
 * The "quest accepted" chime.
 *
 * Synthesised as PCM at play time rather than shipped as an audio file: it's a
 * three-note arpeggio, so generating it keeps the APK smaller and lets us tune
 * the sound in code. Failures are swallowed — a missing sound should never take
 * down a lesson.
 */
object QuestSfx {

    private const val SAMPLE_RATE = 44_100
    private val NOTES = floatArrayOf(523.25f, 659.25f, 783.99f) // C5 – E5 – G5
    private const val NOTE_SECONDS = 0.18f
    private const val GAP_SECONDS = 0.07f

    private val pcm: ShortArray by lazy { renderArpeggio() }

    fun playAccept() {
        try {
            val samples = pcm
            val track = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(samples.size * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            track.write(samples, 0, samples.size)
            track.setNotificationMarkerPosition(samples.size)
            track.setPlaybackPositionUpdateListener(
                object : AudioTrack.OnPlaybackPositionUpdateListener {
                    override fun onMarkerReached(t: AudioTrack?) {
                        runCatching { t?.release() }
                    }
                    override fun onPeriodicNotification(t: AudioTrack?) = Unit
                }
            )
            track.play()
        } catch (e: Exception) {
            Log.w("QuestSfx", "Couldn't play the quest chime: ${e.message}")
        }
    }

    private fun renderArpeggio(): ShortArray {
        val noteSamples = (SAMPLE_RATE * NOTE_SECONDS).toInt()
        val gapSamples = (SAMPLE_RATE * GAP_SECONDS).toInt()
        val total = NOTES.size * (noteSamples + gapSamples)
        val out = ShortArray(total)

        var cursor = 0
        for (freq in NOTES) {
            for (i in 0 until noteSamples) {
                val t = i.toFloat() / SAMPLE_RATE
                // Exponential decay so each note plucks instead of buzzing.
                val envelope = exp(-6.0 * t).toFloat()
                val value = sin(2.0 * PI * freq * t).toFloat() * envelope * 0.35f
                out[cursor++] = (value * Short.MAX_VALUE).toInt().toShort()
            }
            cursor += gapSamples // leave silence between notes
        }
        return out
    }
}
