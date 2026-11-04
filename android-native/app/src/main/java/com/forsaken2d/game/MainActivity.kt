package com.forsaken2d.game

import android.app.Activity
import android.os.Bundle
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.graphics.Typeface
import kotlin.math.max
import kotlin.math.min

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN)
        setContentView(ForsakenView(this))
    }
}

private class ForsakenView(activity: Activity) : View(activity) {
    private val p = Paint(Paint.ANTI_ALIAS_FLAG)
    private var screen = 0 // 0 home, 1 mode info, 2 native gameplay foundation
    private var playerX = 0f
    private var playerY = 0f
    private var downX = 0f
    private var downY = 0f
    private var dragging = false
    private val red = 0xffdc1423.toInt()
    private val white = 0xffffffff.toInt()
    private val muted = 0xffa0a0a0.toInt()

    override fun onDraw(c: Canvas) {
        super.onDraw(c)
        c.drawColor(0xff050505.toInt())
        if (screen == 0) drawHome(c) else if (screen == 1) drawMode(c) else drawGame(c)
    }

    private fun text(c: Canvas, s: String, x: Float, y: Float, size: Float, color: Int, bold: Boolean = false, center: Boolean = false) {
        p.color = color; p.textSize = size; p.typeface = if (bold) Typeface.create("sans-serif", Typeface.BOLD) else Typeface.create("sans-serif", Typeface.NORMAL)
        p.textAlign = if (center) Paint.Align.CENTER else Paint.Align.LEFT
        c.drawText(s, x, y, p)
    }
    private fun panel(c: Canvas, r: RectF, color: Int = 0xff151515.toInt()) { p.color = color; c.drawRoundRect(r, 22f, 22f, p) }
    private fun button(c: Canvas, label: String, y: Float, w: Float, h: Float, fill: Int = red) {
        val x = (width - w) / 2f; panel(c, RectF(x,y,x+w,y+h), fill); text(c,label,width/2f,y+h*.64f, max(17f,h*.27f),white,true,true)
    }

    private fun drawHome(c: Canvas) {
        val w=width.toFloat(); val h=height.toFloat()
        text(c,"F",w/2, h*.20f, min(w,h)*.22f,red,true,true)
        text(c,"FORSAKEN 2D",w/2,h*.30f,min(w,h)*.075f,white,true,true)
        text(c,"ANDROID NATIVE  ·  v0.7.0",w/2,h*.345f,14f,muted,false,true)
        text(c,"FAN PROJECT · 2D ASYMMETRIC SURVIVAL",w/2,h*.405f,12f,muted,false,true)
        val bw=min(w*.82f,520f); val bh=58f
        button(c,"JUGAR OFFLINE",h*.49f,bw,bh)
        button(c,"MULTIJUGADOR · PRÓXIMAMENTE",h*.49f+bh+18,bw,bh,0xff292929.toInt())
        button(c,"PERSONAJES Y PROGRESO · BASE",h*.49f+(bh+18)*2,bw,bh,0xff292929.toInt())
        text(c,"Base nativa inicial. Los sistemas de juego se reconstruirán",w/2,h*.91f,12f,muted,false,true)
        text(c,"progresivamente en próximas versiones.",w/2,h*.94f,12f,muted,false,true)
    }
    private fun drawMode(c: Canvas) {
        val w=width.toFloat(); val h=height.toFloat()
        text(c,"MODO OFFLINE",w/2,h*.22f,32f,white,true,true)
        text(c,"La base Android nativa ya está creada.",w/2,h*.34f,16f,muted,false,true)
        text(c,"Esta versión inicia la reconstrucción del juego.",w/2,h*.39f,16f,muted,false,true)
        button(c,"ABRIR ARENA DE PRUEBA",h*.52f,min(w*.82f,520f),60f)
        button(c,"VOLVER",h*.52f+82,min(w*.82f,520f),60f,0xff292929.toInt())
    }
    private fun drawGame(c: Canvas) {
        val w=width.toFloat(); val h=height.toFloat()
        text(c,"ARENA NATIVA · PROTOTIPO",w/2,38f,16f,white,true,true)
        val top=70f; val bottom=h-90f
        p.color=0xff202820.toInt(); c.drawRect(18f,top,w-18f,bottom,p)
        p.color=0xff334333.toInt(); p.strokeWidth=3f
        for(i in 1..9) c.drawLine(18f+i*(w-36f)/10,top,18f+i*(w-36f)/10,bottom,p)
        for(i in 1..6) c.drawLine(18f,top+i*(bottom-top)/7,w-18f,top+i*(bottom-top)/7,p)
        p.color=0xff555555.toInt(); c.drawRect(w*.18f,h*.28f,w*.34f,h*.36f,p); c.drawRect(w*.65f,h*.58f,w*.82f,h*.67f,p)
        if(playerX==0f){playerX=w*.5f;playerY=(top+bottom)*.55f}
        p.color=0xff4aa3ff.toInt(); c.drawCircle(playerX,playerY,18f,p)
        text(c,"Toca y arrastra para mover el personaje",w/2,h-42f,13f,white,false,true)
        text(c,"VOLVER",w/2, h-12f,12f,red,true,true)
    }

    override fun onTouchEvent(e: MotionEvent): Boolean {
        val x=e.x; val y=e.y; val h=height.toFloat(); val w=width.toFloat()
        when(e.action) {
            MotionEvent.ACTION_DOWN -> { downX=x; downY=y; dragging=screen==2; return true }
            MotionEvent.ACTION_MOVE -> if(screen==2 && dragging) { playerX=(playerX+(x-downX)).coerceIn(25f,w-25f); playerY=(playerY+(y-downY)).coerceIn(85f,h-100f); downX=x; downY=y; invalidate(); return true }
            MotionEvent.ACTION_UP -> {
                if(screen==0 && y in h*.49f..(h*.49f+70f)) screen=1
                else if(screen==1 && y in h*.52f..(h*.52f+70f)) screen=2
                else if(screen==1 && y>h*.52f+75f) screen=0
                else if(screen==2 && y>h-75f) screen=0
                dragging=false; invalidate(); return true
            }
        }
        return true
    }
}
