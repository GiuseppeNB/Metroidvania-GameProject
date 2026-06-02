import { state, statePropsEnum } from "../state/globalStateManager.js";
import { healthBar } from "../ui/healthBar.js";
import { makeBlink } from "./entitySharedLogic.js";

export function makePlayer(k) {
  return k.make([
    k.pos(),
    k.sprite("player"),
    k.area({ shape: new k.Rect(k.vec2(0, 18), 12, 12) }),
    k.anchor("center"),
    k.body({ mass: 100, jumpForce: 320 }), //A gravidade afeta as coisas que estamos criando
    k.doubleJump(state.current().isDoubleJumpUnlocked ? 2 : 1),
    k.opacity(),
    k.health(state.current().playerHp),
    "player",
    {
      speed: 150,
      isAttacking: false,
      setPosition(x, y) {
        this.pos.x = x;
        this.pos.y = y;
      },
      enablePassthrough() {
        this.onBeforePhysicsResolve((collision) => { //É uma função do kaboom para colisão
          if (collision.target.is("passthrough") && this.isJumping()) { //this.isJumping é uma função do kaboom para ver se está pulando
            collision.preventResolution();
          }
        });
      },
      setControls() { //Faz o jogador se mover
        this.controlHandlers = []; //Programação orientada a objetos. O this faz referência ao objeto que está executando a função atual

        this.controlHandlers.push( //Faz o personagem parar de se mover quando morrer; Controle pular
          k.onKeyPress((key) => {
            if (key === "x") {
              if (this.curAnim() !== "jump") this.play("jump"); //Todas as sprite criadas no Kaboom tem acesso a animação do momento
              this.doubleJump();
            }

            if (
              key === "z" &&
              this.curAnim() !== "attack" &&
              this.isGrounded()
            ) {
              this.isAttacking = true;
              this.add([ // Nova função do jogo
                k.pos(this.flipX ? -25 : 0, 10),
                k.area({ shape: new k.Rect(k.vec2(0), 25, 10) }),
                "sword-hitbox",
              ]);
              this.play("attack");

              this.onAnimEnd((anim) => {
                if (anim === "attack") {
                  const swordHitbox = k.get("sword-hitbox", { //k.get() é uma função do kaboom para pegar algo que tem o que queremos
                    recursive: true,
                  })[0];
                  if (swordHitbox) k.destroy(swordHitbox); //k.destroy() é uma função do kaboom para destruir
                  this.isAttacking = false;
                  this.play("idle");
                }
              });
            }
          })
        );

        this.controlHandlers.push( //Controles esquerda/direita
          k.onKeyDown((key) => {
            if (key === "left" && !this.isAttacking) { //Controle esquerda
              if (this.curAnim() !== "run" && this.isGrounded()) { //isGrounded() é uma função oferecida do kaboom
                this.play("run");
              }
              this.flipX = true;
              this.move(-this.speed, 0);
              return;
            }

            if (key === "right" && !this.isAttacking) { //Controle direita
              if (this.curAnim() !== "run" && this.isGrounded()) {
                this.play("run");
              }
              this.flipX = false; // Vira o personagem para a direita
              this.move(this.speed, 0);
              return;
            }
          })
        );

        this.controlHandlers.push(
          k.onKeyRelease(() => {
            if (
              this.curAnim() !== "idle" &&
              this.curAnim() !== "jump" &&
              this.curAnim() !== "fall" &&
              this.curAnim() !== "attack"
            )
              this.play("idle");
          })
        );
      },

      disableControls() {
        for (const handler of this.controlHandlers) {
          handler.cancel();
        }
      },

      respawnIfOutOfBounds(
        boundValue,
        destinationName,
        previousSceneData = { exitName: null }
      ) {
        k.onUpdate(() => {
          if (this.pos.y > boundValue) {
            k.go(destinationName, previousSceneData);
          }
        });
      },

      setEvents() {
        this.onFall(() => { //É uma função do kaboom para ver se caiu
          this.play("fall");
        });

        this.onFallOff(() => { //Quando o jogador cai de uma plataforma
          this.play("fall");
        });

        this.onGround(() => {
          this.play("idle");
        });

        this.onHeadbutt(() => { //Quando bate em um obstáculo com a cabeça
          this.play("fall");
        });

        this.on("heal", () => {
          state.set(statePropsEnum.playerHp, this.hp());
          healthBar.trigger("update");
          

        });

        this.on("hurt", () => {
          makeBlink(k, this);
          if (this.hp() > 0) {
            state.set(statePropsEnum.playerHp, this.hp());
            healthBar.trigger("update");
            return;
          }

          
          k.play("boom");
          this.play("explode");
          state.set(statePropsEnum.playerHp, state.current().maxPlayerHp);
        });

        this.onAnimEnd((anim) => {
          if (anim === "explode") {
            k.go("room1");
          }
        });
      },

      enableDoubleJump() {
        this.numJumps = 2;
      },
    },
  ]);
}